
-- Criar função para atualizar status do equipamento quando uma nova atribuição for criada
CREATE OR REPLACE FUNCTION public.update_equipment_status_on_assignment_create()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a atribuição foi criada com status 'ativo'
  IF NEW.status = 'ativo' THEN
    -- Atualizar equipamento para em_uso
    UPDATE public.equipment 
    SET status = 'em_uso', updated_at = NOW()
    WHERE id = NEW.equipment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que executa após inserção na tabela assignments
CREATE OR REPLACE TRIGGER trigger_update_equipment_status_on_assignment_create
  AFTER INSERT ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_equipment_status_on_assignment_create();

-- Corrigir dados existentes: equipamentos que têm atribuições ativas mas estão como 'disponivel'
UPDATE public.equipment 
SET status = 'em_uso', updated_at = NOW()
WHERE status = 'disponivel' 
AND id IN (
  SELECT DISTINCT equipment_id 
  FROM public.assignments 
  WHERE status = 'ativo'
);

-- Adicionar constraint para prevenir múltiplas atribuições ativas do mesmo equipamento
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_assignment_per_equipment
ON public.assignments (equipment_id) 
WHERE status = 'ativo';
