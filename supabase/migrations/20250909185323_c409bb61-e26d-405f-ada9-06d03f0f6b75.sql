-- Adicionar política SELECT para message_attachments
CREATE POLICY "Users can view attachments of accessible conversations"
ON public.message_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_messages cm
    WHERE cm.id = message_attachments.message_id
    AND can_access_conversation(cm.conversation_id, auth.uid())
  )
);