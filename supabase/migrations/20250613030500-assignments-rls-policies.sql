
-- Habilitar RLS para a tabela assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Política para admins e técnicos verem todas as atribuições
CREATE POLICY "Admins and technicians can view all assignments" 
  ON public.assignments 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'technician')
    )
  );

-- Política para usuários verem apenas suas próprias atribuições
CREATE POLICY "Users can view their own assignments" 
  ON public.assignments 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Política para admins e técnicos criarem atribuições
CREATE POLICY "Admins and technicians can create assignments" 
  ON public.assignments 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'technician')
    )
  );

-- Política para admins e técnicos atualizarem atribuições
CREATE POLICY "Admins and technicians can update assignments" 
  ON public.assignments 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'technician')
    )
  );

-- Habilitar RLS para a tabela equipment_requests
ALTER TABLE public.equipment_requests ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem suas próprias solicitações
CREATE POLICY "Users can view their own equipment requests" 
  ON public.equipment_requests 
  FOR SELECT 
  USING (requester_id = auth.uid());

-- Política para admins e técnicos verem todas as solicitações
CREATE POLICY "Admins and technicians can view all equipment requests" 
  ON public.equipment_requests 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'technician')
    )
  );

-- Política para usuários criarem solicitações
CREATE POLICY "Users can create equipment requests" 
  ON public.equipment_requests 
  FOR INSERT 
  WITH CHECK (requester_id = auth.uid());

-- Política para usuários atualizarem suas próprias solicitações pendentes
CREATE POLICY "Users can update their own pending equipment requests" 
  ON public.equipment_requests 
  FOR UPDATE 
  USING (requester_id = auth.uid() AND status = 'pendente');

-- Política para admins e técnicos atualizarem qualquer solicitação
CREATE POLICY "Admins and technicians can update equipment requests" 
  ON public.equipment_requests 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'technician')
    )
  );
