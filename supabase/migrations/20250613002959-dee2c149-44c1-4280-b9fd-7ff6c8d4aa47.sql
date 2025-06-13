
-- Adicionar coluna para número sequencial dos chamados
ALTER TABLE public.tickets ADD COLUMN ticket_number SERIAL;

-- Criar índice único para o número do chamado
CREATE UNIQUE INDEX idx_tickets_number ON public.tickets(ticket_number);

-- Adicionar coluna para foto de perfil
ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;

-- Criar bucket para fotos de perfil
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true);

-- Políticas para storage de fotos de perfil
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view profile pictures"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can update their own profile picture"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile picture"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política RLS para usuários atualizarem seus próprios chamados
CREATE POLICY "Users can update their own tickets"
ON public.tickets
FOR UPDATE
USING (requester_id = auth.uid())
WITH CHECK (requester_id = auth.uid());

-- Política RLS para usuários excluírem seus próprios chamados
CREATE POLICY "Users can delete their own tickets"
ON public.tickets
FOR DELETE
USING (requester_id = auth.uid());

-- Política para usuários atualizarem seus próprios perfis
CREATE POLICY "Users can update their own profiles"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
