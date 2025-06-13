
-- Remover políticas existentes se houver e recriar
DROP POLICY IF EXISTS "Admins can view all equipment requests" ON public.equipment_requests;
DROP POLICY IF EXISTS "Admins can update equipment requests" ON public.equipment_requests;

-- Recriar políticas RLS para permitir que admins gerenciem solicitações de equipamentos
CREATE POLICY "Admins can view all equipment requests" 
  ON public.equipment_requests 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'technician')
    )
  );

CREATE POLICY "Admins can update equipment requests" 
  ON public.equipment_requests 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'technician')
    )
  );

-- Função para aprovar automaticamente uma solicitação e criar atribuição
CREATE OR REPLACE FUNCTION approve_equipment_request_and_assign(
  request_id UUID,
  equipment_id UUID,
  admin_comments TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record equipment_requests%ROWTYPE;
BEGIN
  -- Buscar a solicitação
  SELECT * INTO request_record FROM equipment_requests WHERE id = request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;
  
  -- Verificar se o equipamento está disponível
  IF NOT EXISTS (
    SELECT 1 FROM equipment 
    WHERE id = equipment_id AND status = 'disponivel'
  ) THEN
    RAISE EXCEPTION 'Equipamento não está disponível';
  END IF;
  
  -- Atualizar status da solicitação
  UPDATE equipment_requests 
  SET 
    status = 'aprovado',
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    admin_comments = approve_equipment_request_and_assign.admin_comments
  WHERE id = request_id;
  
  -- Criar atribuição
  INSERT INTO assignments (
    user_id,
    equipment_id,
    assigned_by,
    start_date,
    status,
    notes
  ) VALUES (
    request_record.requester_id,
    approve_equipment_request_and_assign.equipment_id,
    auth.uid(),
    CURRENT_DATE,
    'ativo',
    'Atribuído automaticamente via aprovação da solicitação ' || request_record.id
  );
  
  -- Atualizar status do equipamento
  UPDATE equipment 
  SET status = 'em_uso'
  WHERE id = approve_equipment_request_and_assign.equipment_id;
END;
$$;

-- Função para rejeitar uma solicitação
CREATE OR REPLACE FUNCTION reject_equipment_request(
  request_id UUID,
  admin_comments TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se a solicitação existe
  IF NOT EXISTS (SELECT 1 FROM equipment_requests WHERE id = request_id) THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;
  
  -- Atualizar status da solicitação para rejeitado
  UPDATE equipment_requests 
  SET 
    status = 'rejeitado',
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    admin_comments = reject_equipment_request.admin_comments
  WHERE id = request_id;
END;
$$;
