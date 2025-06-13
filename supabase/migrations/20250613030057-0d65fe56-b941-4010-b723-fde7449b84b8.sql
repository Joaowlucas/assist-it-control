
-- Adicionar campo company_logo_url na tabela system_settings
ALTER TABLE public.system_settings 
ADD COLUMN company_logo_url TEXT;

-- Criar bucket para logos da empresa
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true);

-- Criar políticas para o bucket company-logos
CREATE POLICY "Admins can upload company logos" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'company-logos' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update company logos" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'company-logos' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete company logos" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'company-logos' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Everyone can view company logos" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'company-logos');
