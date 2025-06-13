
-- Criar bucket para armazenar imagens dos chamados
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true);

-- Criar tabela para anexos dos chamados
CREATE TABLE public.ticket_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de anexos
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem anexos dos seus próprios chamados
CREATE POLICY "Users can view attachments of their own tickets"
ON public.ticket_attachments
FOR SELECT
USING (
  ticket_id IN (
    SELECT id FROM public.tickets 
    WHERE requester_id = auth.uid()
  )
);

-- Política para usuários criarem anexos nos seus próprios chamados
CREATE POLICY "Users can create attachments for their own tickets"
ON public.ticket_attachments
FOR INSERT
WITH CHECK (
  ticket_id IN (
    SELECT id FROM public.tickets 
    WHERE requester_id = auth.uid()
  ) AND uploaded_by = auth.uid()
);

-- Políticas para storage bucket
CREATE POLICY "Users can upload ticket attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view ticket attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'ticket-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política RLS para usuários verem apenas seus próprios chamados
CREATE POLICY "Users can view their own tickets"
ON public.tickets
FOR SELECT
USING (requester_id = auth.uid());

-- Política RLS para usuários criarem seus próprios chamados
CREATE POLICY "Users can create their own tickets"
ON public.tickets
FOR INSERT
WITH CHECK (requester_id = auth.uid());

-- Política RLS para usuários verem apenas suas próprias atribuições
CREATE POLICY "Users can view their own assignments"
ON public.assignments
FOR SELECT
USING (user_id = auth.uid());
