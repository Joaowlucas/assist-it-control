
-- Adicionar campo image_url na tabela chat_rooms
ALTER TABLE public.chat_rooms 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Atualizar a função de trigger para não interferir com o novo campo
-- (a função já existente continuará funcionando normalmente)
