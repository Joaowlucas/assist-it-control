
-- Remover todas as políticas existentes das tabelas de chat
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete messages" ON public.chat_messages;

-- Criar função de segurança para obter salas de chat do usuário
CREATE OR REPLACE FUNCTION public.get_user_chat_rooms(user_id uuid)
RETURNS TABLE(room_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT cp.room_id
  FROM public.chat_participants cp
  WHERE cp.user_id = get_user_chat_rooms.user_id;
$$;

-- Remover políticas RLS existentes da tabela chat_participants
DROP POLICY IF EXISTS "Users can view participants of rooms they belong to" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can leave rooms" ON public.chat_participants;

-- Criar novas políticas RLS usando a função de segurança
CREATE POLICY "Users can view participants of their rooms"
ON public.chat_participants
FOR SELECT
TO authenticated
USING (room_id IN (SELECT get_user_chat_rooms(auth.uid())));

CREATE POLICY "Users can join rooms"
ON public.chat_participants
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave rooms"
ON public.chat_participants
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Atualizar políticas RLS para chat_messages
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;

CREATE POLICY "Users can view messages in their rooms"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (room_id IN (SELECT get_user_chat_rooms(auth.uid())));

-- Política para inserir mensagens
CREATE POLICY "Users can send messages to their rooms"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() 
  AND room_id IN (SELECT get_user_chat_rooms(auth.uid()))
);

-- Habilitar RLS nas tabelas se ainda não estiver habilitado
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para chat_rooms
DROP POLICY IF EXISTS "Users can view active rooms" ON public.chat_rooms;

CREATE POLICY "Users can view active rooms"
ON public.chat_rooms
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Authenticated users can create rooms"
ON public.chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Room creators can update their rooms"
ON public.chat_rooms
FOR UPDATE
TO authenticated
USING (created_by = auth.uid());
