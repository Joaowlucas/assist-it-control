
-- Adicionar campos para personalização de cores na tabela system_settings
ALTER TABLE public.system_settings 
ADD COLUMN custom_primary_color TEXT DEFAULT NULL,
ADD COLUMN custom_primary_foreground_color TEXT DEFAULT NULL,
ADD COLUMN custom_secondary_color TEXT DEFAULT NULL,
ADD COLUMN custom_secondary_foreground_color TEXT DEFAULT NULL,
ADD COLUMN custom_foreground_color TEXT DEFAULT NULL,
ADD COLUMN custom_muted_foreground_color TEXT DEFAULT NULL,
ADD COLUMN custom_destructive_color TEXT DEFAULT NULL,
ADD COLUMN custom_destructive_foreground_color TEXT DEFAULT NULL,
ADD COLUMN enable_custom_colors BOOLEAN DEFAULT false;
