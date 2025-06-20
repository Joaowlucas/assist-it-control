
-- Remover a política atual de UPDATE que está muito restritiva
DROP POLICY IF EXISTS "Assignees and admins can update tickets" ON public.tickets;

-- Criar nova política de UPDATE que permite auto-atribuição de técnicos
CREATE POLICY "Technicians and admins can update tickets" ON public.tickets
FOR UPDATE TO authenticated 
USING (
  -- Chamados já atribuídos ao usuário atual
  assignee_id = auth.uid() OR 
  -- Admins podem editar qualquer chamado
  public.get_user_role() = 'admin' OR
  -- Técnicos podem editar chamados de suas unidades (para auto-atribuição)
  (
    public.get_user_role() = 'technician' AND 
    public.technician_has_unit_access(auth.uid(), unit_id)
  )
);

-- Verificar se a política de SELECT está correta para técnicos
DROP POLICY IF EXISTS "Users can view accessible tickets" ON public.tickets;

CREATE POLICY "Users can view accessible tickets" ON public.tickets 
FOR SELECT USING (
  -- Usuários podem ver seus próprios chamados (como solicitante)
  requester_id = auth.uid() OR 
  -- Usuários podem ver chamados atribuídos a eles
  assignee_id = auth.uid() OR 
  -- Admins podem ver todos os chamados
  public.get_user_role() = 'admin' OR
  -- Técnicos podem ver chamados das unidades que atendem
  (
    public.get_user_role() = 'technician' AND 
    public.technician_has_unit_access(auth.uid(), unit_id)
  )
);
