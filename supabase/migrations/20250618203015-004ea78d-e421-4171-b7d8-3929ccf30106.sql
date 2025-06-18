
-- Create tutorials table
CREATE TABLE public.tutorials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  author_id UUID NOT NULL,
  category TEXT DEFAULT 'geral',
  is_published BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

-- Policy for reading published tutorials (all authenticated users)
CREATE POLICY "Users can view published tutorials" 
  ON public.tutorials 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL AND is_published = true);

-- Policy for admins to manage tutorials
CREATE POLICY "Admins can manage tutorials" 
  ON public.tutorials 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_tutorial_views(tutorial_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.tutorials 
  SET view_count = view_count + 1,
      updated_at = NOW()
  WHERE id = tutorial_id;
END;
$$;

-- Trigger to update updated_at on tutorials
CREATE OR REPLACE FUNCTION public.update_tutorials_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_tutorials_updated_at
  BEFORE UPDATE ON public.tutorials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tutorials_updated_at();
