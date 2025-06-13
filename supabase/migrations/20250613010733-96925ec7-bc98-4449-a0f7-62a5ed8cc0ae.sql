
-- Criar política RLS para permitir que usuários deletem suas próprias solicitações de equipamento
CREATE POLICY "Users can delete their own pending equipment requests" 
  ON public.equipment_requests 
  FOR DELETE 
  USING (auth.uid() = requester_id AND status = 'pendente');
