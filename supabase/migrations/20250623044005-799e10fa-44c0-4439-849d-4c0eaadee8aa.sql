
-- Criar tabela para comentários em posts
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para curtidas em posts
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Adicionar índices para performance
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);

-- Criar bucket para imagens dos comunicados
INSERT INTO storage.buckets (id, name, public) 
VALUES ('announcements', 'announcements', true);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para comentários
CREATE POLICY "Todos podem ver comentários" 
ON public.post_comments FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários podem criar comentários" 
ON public.post_comments FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem editar seus comentários" 
ON public.post_comments FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar seus comentários ou admins podem deletar qualquer" 
ON public.post_comments FOR DELETE 
TO authenticated 
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Políticas RLS para curtidas
CREATE POLICY "Todos podem ver curtidas" 
ON public.post_likes FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários podem curtir posts" 
ON public.post_likes FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem descurtir seus próprios likes" 
ON public.post_likes FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- Políticas para o storage bucket
CREATE POLICY "Todos podem ver imagens" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'announcements');

CREATE POLICY "Admins podem fazer upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'announcements' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins podem deletar imagens" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'announcements' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Trigger para atualizar updated_at em comentários
CREATE OR REPLACE FUNCTION update_post_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_comments_updated_at_trigger
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_updated_at();
