
-- Criar função para obter role do usuário (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Função para verificar se usuário pode acessar sala de chat
CREATE OR REPLACE FUNCTION public.can_access_chat_room_secure(room_id uuid, user_id uuid)
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

-- Função para verificar se usuário pode excluir sala
CREATE OR REPLACE FUNCTION public.can_delete_chat_room(room_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    LEFT JOIN public.profiles p ON p.id = user_id
    WHERE cr.id = room_id 
    AND (
      -- Admin pode excluir qualquer sala
      p.role = 'admin'
      -- Criador da sala pode excluir
      OR cr.created_by = user_id
    )
  );
$$;

-- Remover políticas existentes e criar novas mais restritivas
DROP POLICY IF EXISTS "Users can view accessible chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Room creators and admins can update rooms" ON public.chat_rooms;

-- Política para visualizar salas - mais restritiva para conversas privadas
CREATE POLICY "Users can view accessible chat rooms"
ON public.chat_rooms
FOR SELECT
TO authenticated
USING (
  CASE 
    -- Para salas de unidade, usar lógica existente
    WHEN unit_id IS NOT NULL THEN public.can_access_chat_room_secure(id, auth.uid())
    -- Para conversas privadas (sem unidade), verificar participação direta ou ser admin
    WHEN unit_id IS NULL THEN (
      public.get_current_user_role() = 'admin'
      OR created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.chat_participants cp 
        WHERE cp.room_id = id AND cp.user_id = auth.uid()
      )
    )
    ELSE false
  END
);

CREATE POLICY "Authenticated users can create chat rooms"
ON public.chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Room creators and admins can update rooms"
ON public.chat_rooms
FOR UPDATE
TO authenticated
USING (public.can_delete_chat_room(id, auth.uid()));

-- Políticas para chat_participants - mais restritivas
DROP POLICY IF EXISTS "Users can view participants of accessible rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can manage participants in their rooms" ON public.chat_participants;

CREATE POLICY "Users can view participants of accessible rooms"
ON public.chat_participants
FOR SELECT
TO authenticated
USING (public.can_access_chat_room_secure(room_id, auth.uid()));

CREATE POLICY "Users can manage participants in accessible rooms"
ON public.chat_participants
FOR ALL
TO authenticated
USING (
  public.get_current_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.chat_rooms 
    WHERE id = room_id AND created_by = auth.uid()
  )
);

-- Políticas para chat_messages - garantir acesso apenas a participantes
DROP POLICY IF EXISTS "Users can view messages in accessible rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to accessible rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their messages or admins can update any" ON public.chat_messages;

CREATE POLICY "Users can view messages in accessible rooms"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (public.can_access_chat_room_secure(room_id, auth.uid()));

CREATE POLICY "Users can send messages to accessible rooms"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() 
  AND public.can_access_chat_room_secure(room_id, auth.uid())
);

CREATE POLICY "Users can update their messages or admins can update any"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid() 
  OR public.get_current_user_role() = 'admin'
);
