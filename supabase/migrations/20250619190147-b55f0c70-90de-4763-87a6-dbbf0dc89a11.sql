
-- Remover todas as políticas RLS problemáticas
DROP POLICY IF EXISTS "Users can view accessible chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Room creators and admins can update rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view participants of accessible rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can manage participants in their rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view messages in accessible rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to accessible rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their messages or admins can update any" ON public.chat_messages;

-- Remover funções que causam recursão
DROP FUNCTION IF EXISTS public.can_access_chat_room_secure(uuid, uuid);
DROP FUNCTION IF EXISTS public.user_can_access_chat_room(uuid, uuid);
DROP FUNCTION IF EXISTS public.can_access_chat_room(uuid, uuid);

-- Criar função simples para obter role do usuário (sem RLS)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Função para verificar se é participante direto (sem joins complexos)
CREATE OR REPLACE FUNCTION public.is_participant(room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE room_id = is_participant.room_id 
    AND user_id = auth.uid()
  );
$$;

-- Função para verificar se pode gerenciar sala
CREATE OR REPLACE FUNCTION public.can_manage_room(room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_rooms 
    WHERE id = can_manage_room.room_id 
    AND (
      created_by = auth.uid() 
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  );
$$;

-- Políticas RLS simples e independentes para chat_rooms
CREATE POLICY "chat_rooms_select_policy"
ON public.chat_rooms
FOR SELECT
TO authenticated
USING (
  -- Admin vê tudo
  public.get_user_role() = 'admin'
  -- Criador vê suas salas
  OR created_by = auth.uid()
  -- Participante vê salas onde participa
  OR public.is_participant(id)
  -- Para salas de unidade, usuários da mesma unidade
  OR (
    unit_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.unit_id = chat_rooms.unit_id
        OR (p.role = 'technician' AND EXISTS (
          SELECT 1 FROM public.technician_units tu 
          WHERE tu.technician_id = p.id AND tu.unit_id = chat_rooms.unit_id
        ))
      )
    )
  )
);

CREATE POLICY "chat_rooms_insert_policy"
ON public.chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "chat_rooms_update_policy"
ON public.chat_rooms
FOR UPDATE
TO authenticated
USING (public.can_manage_room(id));

-- Políticas para chat_participants
CREATE POLICY "chat_participants_select_policy"
ON public.chat_participants
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_user_role() = 'admin'
  OR public.can_manage_room(room_id)
);

CREATE POLICY "chat_participants_insert_policy"
ON public.chat_participants
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.can_manage_room(room_id)
);

CREATE POLICY "chat_participants_delete_policy"
ON public.chat_participants
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.can_manage_room(room_id)
);

-- Políticas para chat_messages
CREATE POLICY "chat_messages_select_policy"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  public.get_user_role() = 'admin'
  OR public.is_participant(room_id)
);

CREATE POLICY "chat_messages_insert_policy"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() 
  AND public.is_participant(room_id)
);

CREATE POLICY "chat_messages_update_policy"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid() 
  OR public.get_user_role() = 'admin'
);

-- Garantir que RLS está habilitado
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
