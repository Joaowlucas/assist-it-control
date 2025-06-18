
-- Criar tabela para posts da landing page
CREATE TABLE IF NOT EXISTS public.landing_page_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'poll')),
  author_id UUID REFERENCES public.profiles(id) NOT NULL,
  media_url TEXT,
  poll_options JSONB DEFAULT '[]'::jsonb,
  poll_votes JSONB DEFAULT '{}'::jsonb,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.landing_page_posts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para posts
CREATE POLICY "Posts públicos podem ser visualizados por todos" 
  ON public.landing_page_posts 
  FOR SELECT 
  USING (is_published = true);

CREATE POLICY "Admins podem gerenciar posts" 
  ON public.landing_page_posts 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Atualizar system_settings para incluir configurações da landing page
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS landing_page_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS landing_page_title TEXT DEFAULT 'Bem-vindo ao Sistema de Suporte TI',
ADD COLUMN IF NOT EXISTS landing_page_subtitle TEXT DEFAULT 'Gerencie equipamentos, chamados e muito mais';

-- Criar bucket para mídia da landing page se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('landing-page-media', 'landing-page-media', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket de mídia
CREATE POLICY "Mídia da landing page é pública" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'landing-page-media');

CREATE POLICY "Admins podem fazer upload de mídia" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'landing-page-media' AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins podem deletar mídia" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'landing-page-media' AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_landing_page_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_landing_page_posts_updated_at
  BEFORE UPDATE ON public.landing_page_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_landing_page_posts_updated_at();
