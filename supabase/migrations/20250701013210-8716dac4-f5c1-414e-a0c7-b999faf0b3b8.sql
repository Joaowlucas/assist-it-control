
-- Adicionar campos necessários para o sistema de unidades e aprovação
ALTER TABLE public.landing_page_posts 
ADD COLUMN unit_ids jsonb DEFAULT '[]'::jsonb,
ADD COLUMN status text DEFAULT 'published' CHECK (status IN ('published', 'pending_approval', 'rejected')),
ADD COLUMN approved_by uuid REFERENCES public.profiles(id),
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN rejection_reason text;

-- Atualizar posts existentes para terem pelo menos uma unidade
UPDATE public.landing_page_posts 
SET unit_ids = '["all"]'::jsonb 
WHERE unit_ids = '[]'::jsonb OR unit_ids IS NULL;

-- Criar função para verificar se usuário pode ver post baseado na unidade
CREATE OR REPLACE FUNCTION public.user_can_view_post(post_unit_ids jsonb, user_unit_id uuid, user_role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      -- Admins podem ver todos os posts publicados
      WHEN user_role = 'admin' THEN true
      -- Posts para todas as unidades
      WHEN post_unit_ids ? 'all' THEN true
      -- Posts da unidade do usuário
      WHEN post_unit_ids ? user_unit_id::text THEN true
      ELSE false
    END;
$$;

-- Criar função para verificar se usuário pode aprovar posts
CREATE OR REPLACE FUNCTION public.user_can_approve_posts(user_role text, user_id uuid, post_unit_ids jsonb)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      -- Admins podem aprovar qualquer post
      WHEN user_role = 'admin' THEN true
      -- Técnicos podem aprovar posts de suas unidades
      WHEN user_role = 'technician' THEN EXISTS (
        SELECT 1 FROM public.technician_units tu
        WHERE tu.technician_id = user_id 
        AND post_unit_ids ? tu.unit_id::text
      )
      ELSE false
    END;
$$;

-- Atualizar RLS policies para landing_page_posts
DROP POLICY IF EXISTS "Users can view published posts" ON public.landing_page_posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.landing_page_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.landing_page_posts;

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.landing_page_posts ENABLE ROW LEVEL SECURITY;

-- Policy para visualizar posts
CREATE POLICY "Users can view posts based on unit and status" ON public.landing_page_posts
FOR SELECT USING (
  -- Posts publicados da unidade do usuário
  (status = 'published' AND public.user_can_view_post(
    unit_ids, 
    (SELECT unit_id FROM public.profiles WHERE id = auth.uid()),
    (SELECT role FROM public.profiles WHERE id = auth.uid())::text
  ))
  OR
  -- Próprios posts (qualquer status)
  (author_id = auth.uid())
  OR
  -- Admins e técnicos podem ver posts pendentes para aprovação
  (status = 'pending_approval' AND public.user_can_approve_posts(
    (SELECT role FROM public.profiles WHERE id = auth.uid())::text,
    auth.uid(),
    unit_ids
  ))
);

-- Policy para criar posts
CREATE POLICY "Authenticated users can create posts" ON public.landing_page_posts
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

-- Policy para atualizar posts
CREATE POLICY "Users can update posts based on role" ON public.landing_page_posts
FOR UPDATE USING (
  -- Próprios posts
  author_id = auth.uid()
  OR
  -- Admins e técnicos podem aprovar/rejeitar posts
  public.user_can_approve_posts(
    (SELECT role FROM public.profiles WHERE id = auth.uid())::text,
    auth.uid(),
    unit_ids
  )
);

-- Habilitar realtime para atualizações em tempo real
ALTER TABLE public.landing_page_posts REPLICA IDENTITY FULL;
