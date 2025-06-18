
-- Adicionar campos para edição e anexos na tabela chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN edited_at timestamp with time zone,
ADD COLUMN is_deleted boolean DEFAULT false,
ADD COLUMN attachment_url text,
ADD COLUMN attachment_type text,
ADD COLUMN attachment_name text,
ADD COLUMN attachment_size integer;

-- Criar bucket para arquivos do chat
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true);

-- Criar políticas para o bucket de chat
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Users can view chat attachments they have access to"
ON storage.objects FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'chat-attachments' 
  AND (storage.foldername(name))[1] IN (
    SELECT room_id::text FROM public.chat_participants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own chat attachments"
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'chat-attachments' 
  AND (
    -- Admin pode deletar qualquer arquivo
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR 
    -- Usuário pode deletar seus próprios arquivos
    owner = auth.uid()
  )
);

-- Atualizar políticas de mensagens para permitir edição
CREATE POLICY "Users can update their own messages"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid() 
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Users can soft delete their messages"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid() 
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
