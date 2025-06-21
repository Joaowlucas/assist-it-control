
-- Primeiro, vamos corrigir e otimizar as políticas RLS para chat
-- Remover políticas problemáticas
DROP POLICY IF EXISTS "chat_rooms_select_policy" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_insert_policy" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_update_policy" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_participants_select_policy" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_insert_policy" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_delete_policy" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_messages_select_policy" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_policy" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_update_policy" ON public.chat_messages;

-- Função para verificar se usuário pode acessar uma sala
CREATE OR REPLACE FUNCTION public.can_access_chat_room_v2(room_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_id uuid := auth.uid();
  user_role text;
  user_unit_id uuid;
  room_type chat_type;
  room_unit_id uuid;
  room_selected_units uuid[];
BEGIN
  -- Buscar dados do usuário
  SELECT role, unit_id INTO user_role, user_unit_id
  FROM public.profiles WHERE id = user_id;
  
  -- Admin pode acessar qualquer sala
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Buscar dados da sala
  SELECT type, unit_id, selected_units INTO room_type, room_unit_id, room_selected_units
  FROM public.chat_rooms WHERE id = room_id AND is_active = true;
  
  -- Se não encontrou a sala
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Verificar se é participante direto
  IF EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE room_id = can_access_chat_room_v2.room_id AND user_id = can_access_chat_room_v2.user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Para salas privadas, apenas participantes diretos
  IF room_type = 'private' THEN
    RETURN false;
  END IF;
  
  -- Para salas de unidade
  IF room_type = 'unit' AND room_unit_id IS NOT NULL THEN
    -- Usuário da mesma unidade
    IF user_unit_id = room_unit_id THEN
      RETURN true;
    END IF;
    
    -- Técnico que atende essa unidade
    IF user_role = 'technician' AND EXISTS (
      SELECT 1 FROM public.technician_units 
      WHERE technician_id = user_id AND unit_id = room_unit_id
    ) THEN
      RETURN true;
    END IF;
  END IF;
  
  -- Para grupos com unidades selecionadas
  IF room_type = 'group' AND room_selected_units IS NOT NULL AND array_length(room_selected_units, 1) > 0 THEN
    -- Usuário de unidade selecionada
    IF user_unit_id = ANY(room_selected_units) THEN
      RETURN true;
    END IF;
    
    -- Técnico que atende alguma unidade selecionada
    IF user_role = 'technician' AND EXISTS (
      SELECT 1 FROM public.technician_units 
      WHERE technician_id = user_id AND unit_id = ANY(room_selected_units)
    ) THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$;

-- Novas políticas RLS otimizadas
CREATE POLICY "Users can view accessible chat rooms"
ON public.chat_rooms FOR SELECT
TO authenticated
USING (public.can_access_chat_room_v2(id));

CREATE POLICY "Users can create chat rooms"
ON public.chat_rooms FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins and creators can update rooms"
ON public.chat_rooms FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() 
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Users can view participants of accessible rooms"
ON public.chat_participants FOR SELECT
TO authenticated
USING (public.can_access_chat_room_v2(room_id));

CREATE POLICY "Users can join accessible rooms"
ON public.chat_participants FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND public.can_access_chat_room_v2(room_id)
);

CREATE POLICY "Users can leave rooms or admins can manage"
ON public.chat_participants FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() 
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Users can view messages in accessible rooms"
ON public.chat_messages FOR SELECT
TO authenticated
USING (public.can_access_chat_room_v2(room_id));

CREATE POLICY "Users can send messages to accessible rooms"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() 
  AND public.can_access_chat_room_v2(room_id)
);

CREATE POLICY "Users can edit own messages or admins can edit any"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid() 
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Criar bucket para anexos do chat se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para storage de anexos
DROP POLICY IF EXISTS "Users can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete chat attachments" ON storage.objects;

CREATE POLICY "Users can upload chat attachments"
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Users can view chat attachments"
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can delete chat attachments"
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'chat-attachments' 
  AND (auth.uid()::text = (storage.foldername(name))[1] OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created_desc ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_room ON public.chat_participants(user_id, room_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type_active ON public.chat_rooms(type, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_role_unit ON public.profiles(role, unit_id) WHERE status = 'ativo';

-- Atualizar trigger para adicionar participantes
CREATE OR REPLACE FUNCTION public.auto_add_unit_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sempre adicionar o criador como participante primeiro
  INSERT INTO public.chat_participants (room_id, user_id)
  VALUES (NEW.id, NEW.created_by)
  ON CONFLICT (room_id, user_id) DO NOTHING;
  
  -- Para salas de unidade específica
  IF NEW.type = 'unit' AND NEW.unit_id IS NOT NULL THEN
    -- Adicionar todos os usuários ativos dessa unidade
    INSERT INTO public.chat_participants (room_id, user_id)
    SELECT NEW.id, p.id
    FROM public.profiles p
    WHERE p.unit_id = NEW.unit_id
    AND p.status = 'ativo'
    AND p.id != NEW.created_by
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.room_id = NEW.id AND cp.user_id = p.id
    );
    
    -- Adicionar técnicos que atendem essa unidade
    INSERT INTO public.chat_participants (room_id, user_id)
    SELECT NEW.id, tu.technician_id
    FROM public.technician_units tu
    JOIN public.profiles p ON p.id = tu.technician_id
    WHERE tu.unit_id = NEW.unit_id
    AND p.status = 'ativo'
    AND tu.technician_id != NEW.created_by
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.room_id = NEW.id AND cp.user_id = tu.technician_id
    );
  END IF;
  
  -- Para grupos personalizados com unidades selecionadas
  IF NEW.type = 'group' AND array_length(NEW.selected_units, 1) > 0 THEN
    -- Adicionar usuários das unidades selecionadas
    INSERT INTO public.chat_participants (room_id, user_id)
    SELECT NEW.id, p.id
    FROM public.profiles p
    WHERE p.unit_id = ANY(NEW.selected_units)
    AND p.status = 'ativo'
    AND p.id != NEW.created_by
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.room_id = NEW.id AND cp.user_id = p.id
    );
    
    -- Adicionar técnicos que atendem essas unidades
    INSERT INTO public.chat_participants (room_id, user_id)
    SELECT NEW.id, tu.technician_id
    FROM public.technician_units tu
    JOIN public.profiles p ON p.id = tu.technician_id
    WHERE tu.unit_id = ANY(NEW.selected_units)
    AND p.status = 'ativo'
    AND tu.technician_id != NEW.created_by
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.room_id = NEW.id AND cp.user_id = tu.technician_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Garantir que RLS está habilitado
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
