
-- Criar tabela para configurações do sistema
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'Empresa XYZ Ltda',
  department_name TEXT NOT NULL DEFAULT 'Tecnologia da Informação',
  support_email TEXT NOT NULL DEFAULT 'suporte@empresa.com',
  ticket_email TEXT NOT NULL DEFAULT 'chamados@empresa.com',
  equipment_email TEXT NOT NULL DEFAULT 'equipamentos@empresa.com',
  auto_assign_tickets BOOLEAN NOT NULL DEFAULT true,
  default_priority TEXT NOT NULL DEFAULT 'media',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO public.system_settings (company_name, department_name, support_email, ticket_email, equipment_email, auto_assign_tickets, default_priority)
VALUES ('Empresa XYZ Ltda', 'Tecnologia da Informação', 'suporte@empresa.com', 'chamados@empresa.com', 'equipamentos@empresa.com', true, 'media');

-- Habilitar RLS na tabela system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Política para que apenas admins possam ver as configurações
CREATE POLICY "Admins can view system settings" 
  ON public.system_settings 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para que apenas admins possam atualizar as configurações
CREATE POLICY "Admins can update system settings" 
  ON public.system_settings 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Habilitar RLS na tabela units (se ainda não estiver habilitado)
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Políticas para unidades - apenas admins podem gerenciar
CREATE POLICY "Admins can view all units" 
  ON public.units 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert units" 
  ON public.units 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update units" 
  ON public.units 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete units" 
  ON public.units 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para atualizar updated_at automaticamente na tabela system_settings
CREATE TRIGGER update_system_settings_updated_at 
  BEFORE UPDATE ON public.system_settings 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
