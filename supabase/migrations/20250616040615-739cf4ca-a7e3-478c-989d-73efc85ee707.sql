
-- Adicionar campo de telefone na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN phone TEXT;

-- Criar tabela para configurações de notificação
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('tickets', 'assignments', 'equipment')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  phone_override TEXT, -- permite usar telefone diferente do perfil
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Criar tabela para log de notificações enviadas
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'ticket', 'assignment', 'equipment'
  entity_id UUID NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para as novas tabelas
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notification_settings
CREATE POLICY "Users can view their own notification settings" 
  ON public.notification_settings 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notification settings" 
  ON public.notification_settings 
  FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all notification settings" 
  ON public.notification_settings 
  FOR SELECT 
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Políticas RLS para notification_logs
CREATE POLICY "Users can view their own notification logs" 
  ON public.notification_logs 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all notification logs" 
  ON public.notification_logs 
  FOR SELECT 
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Função para buscar usuários que devem receber notificações
CREATE OR REPLACE FUNCTION get_notification_recipients(
  notification_type TEXT,
  entity_data JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  user_id UUID,
  phone TEXT,
  name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(ns.phone_override, p.phone) as phone,
    p.name
  FROM public.profiles p
  LEFT JOIN public.notification_settings ns ON p.id = ns.user_id AND ns.notification_type = get_notification_recipients.notification_type
  WHERE 
    -- Usuário tem telefone configurado
    (COALESCE(ns.phone_override, p.phone) IS NOT NULL AND COALESCE(ns.phone_override, p.phone) != '')
    -- Notificações estão habilitadas (default true se não configurado)
    AND COALESCE(ns.enabled, true) = true
    -- Usuário está ativo
    AND p.status = 'ativo'
    -- Para tickets e assignments, notificar apenas se for do mesmo unit ou admin
    AND (
      notification_type = 'equipment' 
      OR p.role = 'admin'
      OR (notification_type IN ('tickets', 'assignments') AND (
        p.unit_id = (entity_data->>'unit_id')::UUID
        OR p.role = 'admin'
      ))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
