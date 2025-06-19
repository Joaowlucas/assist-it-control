
-- Primeiro, vamos limpar todas as políticas RLS existentes e recriar do zero
DROP POLICY IF EXISTS "Users can view accessible chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Room creators and admins can update rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view participants of accessible rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can add participants to their rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can remove participants from their rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view messages in accessible rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to accessible rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;

-- Criar bucket para anexos do chat se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket de anexos
DROP POLICY IF EXISTS "Authenticated users can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat attachments they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat attachments" ON storage.objects;

CREATE POLICY "Authenticated users can upload chat attachments"
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
USING (bucket_id = 'chat-attachments');

-- Função simplificada para verificar acesso às salas
CREATE OR REPLACE FUNCTION public.user_can_access_chat_room(room_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    LEFT JOIN public.profiles p ON p.id = user_id
    LEFT JOIN public.chat_participants cp ON cp.room_id = cr.id AND cp.user_id = user_id
    WHERE cr.id = room_id 
    AND cr.is_active = true
    AND (
      -- Admin vê todas as salas
      p.role = 'admin'
      -- Usuário é participante direto
      OR cp.user_id IS NOT NULL
      -- Criador da sala
      OR cr.created_by = user_id
      -- Para salas de unidade específica, verificar se usuário pertence à unidade
      OR (cr.unit_id IS NOT NULL AND p.unit_id = cr.unit_id)
      -- Para técnicos, verificar suas unidades atribuídas
      OR (p.role = 'technician' AND cr.unit_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.technician_units tu 
        WHERE tu.technician_id = p.id AND tu.unit_id = cr.unit_id
      ))
    )
  );
$$;

-- Políticas RLS simplificadas para chat_rooms
CREATE POLICY "Users can view accessible chat rooms"
ON public.chat_rooms
FOR SELECT
TO authenticated
USING (public.user_can_access_chat_room(id, auth.uid()));

CREATE POLICY "Authenticated users can create chat rooms"
ON public.chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Room creators and admins can update rooms"
ON public.chat_rooms
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() 
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Políticas para chat_participants
CREATE POLICY "Users can view participants of accessible rooms"
ON public.chat_participants
FOR SELECT
TO authenticated
USING (public.user_can_access_chat_room(room_id, auth.uid()));

CREATE POLICY "Users can manage participants in their rooms"
ON public.chat_participants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms 
    WHERE id = room_id 
    AND (
      created_by = auth.uid() 
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  )
);

-- Políticas para chat_messages
CREATE POLICY "Users can view messages in accessible rooms"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (public.user_can_access_chat_room(room_id, auth.uid()));

CREATE POLICY "Users can send messages to accessible rooms"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() 
  AND public.user_can_access_chat_room(room_id, auth.uid())
);

CREATE POLICY "Users can update their messages or admins can update any"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid() 
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Melhorar o trigger de auto-adição de participantes
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
  
  -- Se a sala tem uma unidade específica, adicionar todos os usuários ativos dessa unidade
  IF NEW.unit_id IS NOT NULL THEN
    INSERT INTO public.chat_participants (room_id, user_id)
    SELECT NEW.id, p.id
    FROM public.profiles p
    WHERE p.unit_id = NEW.unit_id
    AND p.status = 'ativo'
    AND p.id != NEW.created_by -- Evitar duplicação do criador
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.room_id = NEW.id AND cp.user_id = p.id
    );
    
    -- Adicionar também técnicos que atendem essa unidade
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
  
  RETURN NEW;
END;
$$;

-- Reabilitar RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_user ON public.chat_participants(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON public.chat_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_unit_active ON public.chat_rooms(unit_id, is_active);
