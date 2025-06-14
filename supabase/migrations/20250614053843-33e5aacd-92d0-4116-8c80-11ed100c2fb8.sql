
-- Remover políticas existentes de anexos que são muito restritivas
DROP POLICY IF EXISTS "Users can view attachments of their own tickets" ON public.ticket_attachments;
DROP POLICY IF EXISTS "Users can create attachments for their own tickets" ON public.ticket_attachments;

-- Remover políticas existentes de storage para anexos
DROP POLICY IF EXISTS "Users can upload ticket attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view ticket attachments" ON storage.objects;

-- Criar políticas mais flexíveis para anexos dos chamados
-- Permitir visualizar anexos se o usuário pode ver o chamado
CREATE POLICY "Users can view ticket attachments if they can view the ticket"
ON public.ticket_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_attachments.ticket_id
    AND (
      t.requester_id = auth.uid() OR
      t.assignee_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'technician'))
    )
  )
);

-- Permitir criar anexos se o usuário pode ver o chamado
CREATE POLICY "Users can create ticket attachments if they can access the ticket"
ON public.ticket_attachments
FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_attachments.ticket_id
    AND (
      t.requester_id = auth.uid() OR
      t.assignee_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'technician'))
    )
  )
);

-- Permitir remover anexos se o usuário os criou ou é admin
CREATE POLICY "Users can delete their own ticket attachments or admins can delete any"
ON public.ticket_attachments
FOR DELETE
USING (
  uploaded_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas de storage mais flexíveis
-- Permitir upload para usuários autenticados
CREATE POLICY "Authenticated users can upload ticket attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  auth.uid() IS NOT NULL
);

-- Permitir visualização para usuários autenticados (a segurança é controlada na tabela ticket_attachments)
CREATE POLICY "Authenticated users can view ticket attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'ticket-attachments' AND
  auth.uid() IS NOT NULL
);

-- Permitir remoção para o próprio usuário ou admins
CREATE POLICY "Users can delete their own ticket attachments from storage"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'ticket-attachments' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
);
