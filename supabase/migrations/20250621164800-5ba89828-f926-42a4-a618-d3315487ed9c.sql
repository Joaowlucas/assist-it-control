
-- LIMPEZA COMPLETA: Remover todas as políticas RLS problemáticas
DROP POLICY IF EXISTS "Simple chat rooms access" ON public.chat_rooms;
DROP POLICY IF EXISTS "Simple chat rooms insert" ON public.chat_rooms;
DROP POLICY IF EXISTS "Simple chat rooms update" ON public.chat_rooms;
DROP POLICY IF EXISTS "Simple participants access" ON public.chat_participants;
DROP POLICY IF EXISTS "Simple participants insert" ON public.chat_participants;
DROP POLICY IF EXISTS "Simple participants delete" ON public.chat_participants;
DROP POLICY IF EXISTS "Simple messages access" ON public.chat_messages;
DROP POLICY IF EXISTS "Simple messages insert" ON public.chat_messages;
DROP POLICY IF EXISTS "Simple messages update" ON public.chat_messages;

-- Função definitiva para obter informações do usuário atual (sem recursão)
CREATE OR REPLACE FUNCTION public.get_current_user_safe()
RETURNS TABLE(user_id uuid, user_role text, user_unit_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id, role::text, unit_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Função para verificar acesso a salas de chat (DEFINITIVA)
CREATE OR REPLACE FUNCTION public.user_can_access_chat_room(room_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  current_user_id uuid;
  current_user_role text;
  current_user_unit_id uuid;
  room_info record;
BEGIN
  -- Obter dados do usuário atual
  SELECT user_id, user_role, user_unit_id 
  INTO current_user_id, current_user_role, current_user_unit_id
  FROM public.get_current_user_safe();
  
  -- Se não há usuário logado, bloquear acesso
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- ADMIN vê TUDO (moderação total)
  IF current_user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Obter informações da sala
  SELECT type, unit_id, selected_units, is_active
  INTO room_info
  FROM public.chat_rooms 
  WHERE id = room_id;
  
  -- Se sala não existe ou está inativa
  IF NOT FOUND OR NOT room_info.is_active THEN
    RETURN false;
  END IF;
  
  -- Verificar se é participante direto (para TODAS as salas)
  IF EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE room_id = user_can_access_chat_room.room_id AND user_id = current_user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Para salas PRIVADAS, apenas participantes diretos
  IF room_info.type = 'private' THEN
    RETURN false;
  END IF;
  
  -- Para salas de UNIDADE
  IF room_info.type = 'unit' AND room_info.unit_id IS NOT NULL THEN
    -- Usuário da mesma unidade
    IF current_user_unit_id = room_info.unit_id THEN
      RETURN true;
    END IF;
    
    -- Técnico que atende essa unidade
    IF current_user_role = 'technician' AND EXISTS (
      SELECT 1 FROM public.technician_units 
      WHERE technician_id = current_user_id AND unit_id = room_info.unit_id
    ) THEN
      RETURN true;
    END IF;
  END IF;
  
  -- Para GRUPOS com unidades selecionadas
  IF room_info.type = 'group' AND room_info.selected_units IS NOT NULL 
     AND array_length(room_info.selected_units, 1) > 0 THEN
    -- Usuário de unidade selecionada
    IF current_user_unit_id = ANY(room_info.selected_units) THEN
      RETURN true;
    END IF;
    
    -- Técnico que atende alguma unidade do grupo
    IF current_user_role = 'technician' AND EXISTS (
      SELECT 1 FROM public.technician_units 
      WHERE technician_id = current_user_id AND unit_id = ANY(room_info.selected_units)
    ) THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$;

-- Função para buscar usuários disponíveis para chat (SEM RECURSÃO)
CREATE OR REPLACE FUNCTION public.get_chat_available_users()
RETURNS TABLE(
  id uuid, 
  name text, 
  email text, 
  role text, 
  unit_id uuid, 
  avatar_url text, 
  unit_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  current_user_id uuid;
  current_user_role text;
  current_user_unit_id uuid;
BEGIN
  -- Obter dados do usuário atual
  SELECT user_id, user_role, user_unit_id 
  INTO current_user_id, current_user_role, current_user_unit_id
  FROM public.get_current_user_safe();
  
  -- Se não há usuário logado
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- ADMIN pode conversar com QUALQUER PESSOA
  IF current_user_role = 'admin' THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p.unit_id, p.avatar_url, u.name as unit_name
    FROM public.profiles p
    LEFT JOIN public.units u ON u.id = p.unit_id
    WHERE p.status = 'ativo' AND p.id != current_user_id
    ORDER BY p.name;
    
  -- TÉCNICO pode conversar com: admins + usuários das unidades que atende
  ELSIF current_user_role = 'technician' THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p.unit_id, p.avatar_url, u.name as unit_name
    FROM public.profiles p
    LEFT JOIN public.units u ON u.id = p.unit_id
    WHERE p.status = 'ativo' 
    AND p.id != current_user_id
    AND (
      p.role::text = 'admin'
      OR p.unit_id IN (
        SELECT tu.unit_id FROM public.technician_units tu 
        WHERE tu.technician_id = current_user_id
      )
      OR p.unit_id = current_user_unit_id
    )
    ORDER BY p.name;
    
  -- USUÁRIO pode conversar com: admins + técnicos da sua unidade + usuários da mesma unidade
  ELSE
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p.unit_id, p.avatar_url, u.name as unit_name
    FROM public.profiles p
    LEFT JOIN public.units u ON u.id = p.unit_id
    WHERE p.status = 'ativo' 
    AND p.id != current_user_id
    AND (
      p.role::text = 'admin'
      OR (p.role::text = 'technician' AND (
        p.unit_id = current_user_unit_id
        OR EXISTS (
          SELECT 1 FROM public.technician_units tu 
          WHERE tu.technician_id = p.id AND tu.unit_id = current_user_unit_id
        )
      ))
      OR (p.role::text = 'user' AND p.unit_id = current_user_unit_id)
    )
    ORDER BY p.name;
  END IF;
END;
$$;

-- POLÍTICAS RLS DEFINITIVAS E SIMPLES
CREATE POLICY "Chat rooms - access policy"
ON public.chat_rooms FOR SELECT
TO authenticated
USING (public.user_can_access_chat_room(id));

CREATE POLICY "Chat rooms - create policy"
ON public.chat_rooms FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Chat rooms - update policy"
ON public.chat_rooms FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() 
  OR (SELECT user_role FROM public.get_current_user_safe()) = 'admin'
);

CREATE POLICY "Chat participants - access policy"
ON public.chat_participants FOR SELECT
TO authenticated
USING (public.user_can_access_chat_room(room_id));

CREATE POLICY "Chat participants - create policy"
ON public.chat_participants FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND public.user_can_access_chat_room(room_id)
);

CREATE POLICY "Chat participants - delete policy"
ON public.chat_participants FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() 
  OR (SELECT user_role FROM public.get_current_user_safe()) = 'admin'
);

CREATE POLICY "Chat messages - access policy"
ON public.chat_messages FOR SELECT
TO authenticated
USING (public.user_can_access_chat_room(room_id));

CREATE POLICY "Chat messages - create policy"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() 
  AND public.user_can_access_chat_room(room_id)
);

CREATE POLICY "Chat messages - update policy"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid() 
  OR (SELECT user_role FROM public.get_current_user_safe()) = 'admin'
);

-- Criar bucket para anexos se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para storage
CREATE POLICY "Chat attachments - upload policy"
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Chat attachments - access policy"
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Chat attachments - delete policy"
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'chat-attachments' 
  AND (auth.uid()::text = (storage.foldername(name))[1] 
       OR (SELECT user_role FROM public.get_current_user_safe()) = 'admin')
);

-- Trigger atualizado para adicionar participantes automaticamente
CREATE OR REPLACE FUNCTION public.auto_add_chat_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sempre adicionar o criador como participante
  INSERT INTO public.chat_participants (room_id, user_id)
  VALUES (NEW.id, NEW.created_by)
  ON CONFLICT (room_id, user_id) DO NOTHING;
  
  -- Para salas de UNIDADE específica
  IF NEW.type = 'unit' AND NEW.unit_id IS NOT NULL THEN
    -- Adicionar todos os usuários ativos da unidade
    INSERT INTO public.chat_participants (room_id, user_id)
    SELECT NEW.id, p.id
    FROM public.profiles p
    WHERE p.unit_id = NEW.unit_id
    AND p.status = 'ativo'
    AND p.id != NEW.created_by
    ON CONFLICT (room_id, user_id) DO NOTHING;
    
    -- Adicionar técnicos que atendem essa unidade
    INSERT INTO public.chat_participants (room_id, user_id)
    SELECT NEW.id, tu.technician_id
    FROM public.technician_units tu
    JOIN public.profiles p ON p.id = tu.technician_id
    WHERE tu.unit_id = NEW.unit_id
    AND p.status = 'ativo'
    AND tu.technician_id != NEW.created_by
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;
  
  -- Para GRUPOS com unidades selecionadas
  IF NEW.type = 'group' AND array_length(NEW.selected_units, 1) > 0 THEN
    -- Adicionar usuários das unidades selecionadas
    INSERT INTO public.chat_participants (room_id, user_id)
    SELECT NEW.id, p.id
    FROM public.profiles p
    WHERE p.unit_id = ANY(NEW.selected_units)
    AND p.status = 'ativo'
    AND p.id != NEW.created_by
    ON CONFLICT (room_id, user_id) DO NOTHING;
    
    -- Adicionar técnicos das unidades selecionadas
    INSERT INTO public.chat_participants (room_id, user_id)
    SELECT NEW.id, tu.technician_id
    FROM public.technician_units tu
    JOIN public.profiles p ON p.id = tu.technician_id
    WHERE tu.unit_id = ANY(NEW.selected_units)
    AND p.status = 'ativo'
    AND tu.technician_id != NEW.created_by
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar trigger
DROP TRIGGER IF EXISTS auto_add_participants_trigger ON public.chat_rooms;
CREATE TRIGGER auto_add_participants_trigger
  AFTER INSERT ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_chat_participants();

-- Garantir RLS habilitado
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Índices para performance otimizada
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created_desc ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_room ON public.chat_participants(user_id, room_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_active_type ON public.chat_rooms(is_active, type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_status_role ON public.profiles(status, role) WHERE status = 'ativo';
