
-- Primeiro, remover todas as políticas que dependem da função can_access_conversation
DROP POLICY IF EXISTS "Users can view accessible conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations in their unit" ON public.conversations;
DROP POLICY IF EXISTS "Conversation creators and admins can update" ON public.conversations;

DROP POLICY IF EXISTS "Users can view participants of accessible conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_participants;

-- Remover políticas de chat_messages que também podem depender da função
DROP POLICY IF EXISTS "Users can view messages in accessible conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to accessible conversations" ON public.chat_messages;

-- Remover políticas de message_attachments que podem depender da função
DROP POLICY IF EXISTS "Users can view attachments in accessible conversations" ON public.message_attachments;

-- Remover políticas de message_reads que podem depender da função
DROP POLICY IF EXISTS "Users can view read status of accessible messages" ON public.message_reads;

-- Agora podemos remover a função com segurança
DROP FUNCTION IF EXISTS public.can_access_conversation(uuid, uuid);

-- Recriar a função corrigida
CREATE OR REPLACE FUNCTION public.can_access_conversation(conversation_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    JOIN public.conversations c ON c.id = cp.conversation_id
    JOIN public.profiles p ON p.id = user_id
    WHERE cp.conversation_id = conversation_id
    AND cp.user_id = user_id
    AND cp.left_at IS NULL
    AND c.is_active = true
    AND (
      -- Mesma unidade ou admin
      c.unit_id = p.unit_id OR p.role = 'admin'
    )
  );
$$;

-- Recriar as políticas RLS para conversations
CREATE POLICY "Users can view accessible conversations"
ON public.conversations FOR SELECT 
TO authenticated 
USING (
  public.can_access_conversation(id, auth.uid()) OR
  created_by = auth.uid()
);

CREATE POLICY "Users can create conversations in their unit"
ON public.conversations FOR INSERT 
TO authenticated 
WITH CHECK (
  created_by = auth.uid() AND
  (unit_id = (SELECT unit_id FROM public.profiles WHERE id = auth.uid()) OR
   (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
);

CREATE POLICY "Conversation creators and admins can update"
ON public.conversations FOR UPDATE 
TO authenticated 
USING (
  created_by = auth.uid() OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Recriar as políticas RLS para conversation_participants
CREATE POLICY "Users can view participants of accessible conversations"
ON public.conversation_participants FOR SELECT 
TO authenticated 
USING (
  public.can_access_conversation(conversation_id, auth.uid()) OR
  user_id = auth.uid()
);

CREATE POLICY "Users can add participants when creating conversations"
ON public.conversation_participants FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Usuário pode se adicionar
  user_id = auth.uid() OR
  -- Criador da conversa pode adicionar outros participantes
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id 
    AND c.created_by = auth.uid()
  ) OR
  -- Admin pode adicionar qualquer um
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Users can leave conversations"
ON public.conversation_participants FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Recriar políticas básicas para chat_messages (se necessário)
CREATE POLICY "Users can view messages in accessible conversations"
ON public.chat_messages FOR SELECT 
TO authenticated 
USING (public.can_access_conversation(conversation_id, auth.uid()));

CREATE POLICY "Users can send messages to accessible conversations"
ON public.chat_messages FOR INSERT 
TO authenticated 
WITH CHECK (
  sender_id = auth.uid() AND 
  public.can_access_conversation(conversation_id, auth.uid())
);
