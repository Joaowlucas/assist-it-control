
-- Criar tabela para relacionamento many-to-many entre técnicos e unidades
CREATE TABLE public.technician_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(technician_id, unit_id)
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.technician_units ENABLE ROW LEVEL SECURITY;

-- Política para técnicos verem suas próprias unidades
CREATE POLICY "Technicians can view their own units" ON public.technician_units
FOR SELECT USING (technician_id = auth.uid());

-- Política para admins gerenciarem todas as atribuições de unidades
CREATE POLICY "Admins can manage all technician units" ON public.technician_units
FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Criar índices para performance
CREATE INDEX idx_technician_units_technician_id ON public.technician_units(technician_id);
CREATE INDEX idx_technician_units_unit_id ON public.technician_units(unit_id);

-- Função para obter unidades de um técnico
CREATE OR REPLACE FUNCTION public.get_technician_units(technician_id UUID)
RETURNS TABLE(unit_id UUID, unit_name TEXT) 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT tu.unit_id, u.name
  FROM public.technician_units tu
  JOIN public.units u ON u.id = tu.unit_id
  WHERE tu.technician_id = get_technician_units.technician_id;
$$;

-- Função para verificar se um técnico tem acesso a uma unidade específica
CREATE OR REPLACE FUNCTION public.technician_has_unit_access(technician_id UUID, unit_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.technician_units 
    WHERE technician_id = technician_has_unit_access.technician_id 
    AND unit_id = technician_has_unit_access.unit_id
  );
$$;

-- Atualizar políticas RLS para tickets considerando técnicos com múltiplas unidades
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;

CREATE POLICY "Users can view accessible tickets" ON public.tickets FOR SELECT USING (
  requester_id = auth.uid() OR 
  assignee_id = auth.uid() OR 
  public.get_user_role(auth.uid()) = 'admin' OR
  (public.get_user_role(auth.uid()) = 'technician' AND 
   public.technician_has_unit_access(auth.uid(), unit_id))
);

-- Atualizar políticas RLS para equipamentos considerando técnicos com múltiplas unidades
DROP POLICY IF EXISTS "Technicians and admins can manage equipment" ON public.equipment;

CREATE POLICY "Admins can manage all equipment" ON public.equipment FOR ALL USING (
  public.get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Technicians can manage equipment in their units" ON public.equipment FOR ALL USING (
  public.get_user_role(auth.uid()) = 'technician' AND 
  (unit_id IS NULL OR public.technician_has_unit_access(auth.uid(), unit_id))
);

-- Atualizar políticas RLS para assignments considerando técnicos com múltiplas unidades
DROP POLICY IF EXISTS "Technicians and admins can manage assignments" ON public.assignments;

CREATE POLICY "Admins can manage all assignments" ON public.assignments FOR ALL USING (
  public.get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Technicians can manage assignments in their units" ON public.assignments FOR ALL USING (
  public.get_user_role(auth.uid()) = 'technician' AND 
  EXISTS (
    SELECT 1 FROM public.equipment e 
    WHERE e.id = equipment_id 
    AND (e.unit_id IS NULL OR public.technician_has_unit_access(auth.uid(), e.unit_id))
  )
);
