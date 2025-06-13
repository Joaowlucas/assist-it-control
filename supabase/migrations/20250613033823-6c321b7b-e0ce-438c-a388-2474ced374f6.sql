
-- Criar função para atualizar status do equipamento quando atribuição for finalizada
CREATE OR REPLACE FUNCTION public.update_equipment_status_on_assignment_end()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a atribuição foi finalizada (mudou para 'finalizado')
  IF NEW.status = 'finalizado' AND OLD.status != 'finalizado' THEN
    -- Verificar se não há outras atribuições ativas para o mesmo equipamento
    IF NOT EXISTS (
      SELECT 1 FROM public.assignments 
      WHERE equipment_id = NEW.equipment_id 
      AND status = 'ativo' 
      AND id != NEW.id
    ) THEN
      -- Atualizar equipamento para disponível
      UPDATE public.equipment 
      SET status = 'disponivel', updated_at = NOW()
      WHERE id = NEW.equipment_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que executa após atualização na tabela assignments
CREATE OR REPLACE TRIGGER trigger_update_equipment_status_on_assignment_end
  AFTER UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_equipment_status_on_assignment_end();

-- Corrigir dados existentes: equipamentos que estão 'em_uso' mas sem atribuição ativa
UPDATE public.equipment 
SET status = 'disponivel', updated_at = NOW()
WHERE status = 'em_uso' 
AND id NOT IN (
  SELECT DISTINCT equipment_id 
  FROM public.assignments 
  WHERE status = 'ativo'
);
