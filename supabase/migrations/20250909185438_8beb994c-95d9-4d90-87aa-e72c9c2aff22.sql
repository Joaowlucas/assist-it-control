-- Adicionar políticas UPDATE e DELETE para message_attachments
CREATE POLICY "Users can update their own message attachments"
ON public.message_attachments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_messages cm
    WHERE cm.id = message_attachments.message_id
    AND cm.sender_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own message attachments"
ON public.message_attachments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_messages cm
    WHERE cm.id = message_attachments.message_id
    AND cm.sender_id = auth.uid()
  )
);