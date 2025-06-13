
-- Adicionar colunas para tombamento e localização na tabela equipment
ALTER TABLE public.equipment 
ADD COLUMN IF NOT EXISTS tombamento TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Criar bucket para fotos de equipamentos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'equipment-photos',
  'equipment-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Criar tabela para múltiplas fotos de equipamentos
CREATE TABLE IF NOT EXISTS public.equipment_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT false,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_equipment_photos_equipment_id ON public.equipment_photos(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_photos_is_primary ON public.equipment_photos(is_primary);

-- Habilitar RLS na tabela equipment_photos
ALTER TABLE public.equipment_photos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para equipment_photos
CREATE POLICY "Everyone can view equipment photos"
  ON public.equipment_photos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload equipment photos"
  ON public.equipment_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Admins and photo uploaders can update equipment photos"
  ON public.equipment_photos
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = uploaded_by OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'technician')
    )
  );

CREATE POLICY "Admins and photo uploaders can delete equipment photos"
  ON public.equipment_photos
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = uploaded_by OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'technician')
    )
  );

-- Políticas para storage bucket equipment-photos
CREATE POLICY "Anyone can view equipment photos storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'equipment-photos');

CREATE POLICY "Authenticated users can upload equipment photos storage"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'equipment-photos');

CREATE POLICY "Users can update their own equipment photos storage"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'equipment-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own equipment photos storage"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'equipment-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Função para gerar tombamento automático
CREATE OR REPLACE FUNCTION generate_tombamento()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  tombamento TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Buscar o próximo número sequencial para o ano atual
  SELECT COALESCE(MAX(
    CASE 
      WHEN tombamento ~ ('^EQ-' || current_year || '-[0-9]+$')
      THEN (regexp_split_to_array(tombamento, '-'))[3]::INTEGER
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM public.equipment
  WHERE tombamento IS NOT NULL;
  
  -- Gerar tombamento no formato EQ-YYYY-NNN
  tombamento := 'EQ-' || current_year || '-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN tombamento;
END;
$$;

-- Trigger para gerar tombamento automaticamente se não fornecido
CREATE OR REPLACE FUNCTION set_equipment_tombamento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tombamento IS NULL OR NEW.tombamento = '' THEN
    NEW.tombamento := generate_tombamento();
  END IF;
  RETURN NEW;
END;
$$;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_set_equipment_tombamento ON public.equipment;

CREATE TRIGGER trigger_set_equipment_tombamento
  BEFORE INSERT ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION set_equipment_tombamento();

-- Trigger para atualizar updated_at em equipment_photos
CREATE TRIGGER trigger_equipment_photos_updated_at
  BEFORE UPDATE ON public.equipment_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
