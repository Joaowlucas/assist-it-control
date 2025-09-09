-- Criar tabelas para fluxos personalizados do WhatsApp
CREATE TABLE public.whatsapp_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  trigger_keywords TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.whatsapp_flow_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.whatsapp_flows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_type TEXT NOT NULL, -- 'message', 'input', 'condition', 'action'
  step_name TEXT NOT NULL,
  message_text TEXT,
  input_type TEXT, -- 'text', 'number', 'options'
  input_options JSONB DEFAULT '[]'::jsonb,
  condition_field TEXT,
  condition_operator TEXT, -- 'equals', 'contains', 'greater_than', etc.
  condition_value TEXT,
  next_step_success UUID REFERENCES public.whatsapp_flow_steps(id),
  next_step_failure UUID REFERENCES public.whatsapp_flow_steps(id),
  actions JSONB DEFAULT '{}'::jsonb, -- Para ações como criar ticket, enviar email, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_flow_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies para whatsapp_flows
CREATE POLICY "Admins can manage whatsapp flows"
ON public.whatsapp_flows
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'::user_role
));

CREATE POLICY "Everyone can view active flows"
ON public.whatsapp_flows
FOR SELECT
USING (is_active = true);

-- RLS Policies para whatsapp_flow_steps
CREATE POLICY "Admins can manage flow steps"
ON public.whatsapp_flow_steps
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'::user_role
));

CREATE POLICY "Everyone can view flow steps"
ON public.whatsapp_flow_steps
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM whatsapp_flows wf 
  WHERE wf.id = flow_id AND wf.is_active = true
));

-- Trigger para updated_at
CREATE TRIGGER update_whatsapp_flows_updated_at
BEFORE UPDATE ON public.whatsapp_flows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_flow_steps_updated_at
BEFORE UPDATE ON public.whatsapp_flow_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir fluxo padrão para criação de chamados
INSERT INTO public.whatsapp_flows (name, description, is_active, trigger_keywords)
VALUES (
  'Criar Chamado de Suporte',
  'Fluxo padrão para criação de chamados via WhatsApp',
  true,
  ARRAY['suporte', 'ajuda', 'chamado', 'problema']
);

-- Inserir os passos do fluxo padrão
INSERT INTO public.whatsapp_flow_steps (flow_id, step_order, step_type, step_name, message_text, input_type, next_step_success) VALUES
((SELECT id FROM whatsapp_flows WHERE name = 'Criar Chamado de Suporte'), 1, 'message', 'boas_vindas', '🤖 *BOT DE SUPORTE TI*

👋 Olá! Vou te ajudar a abrir um chamado.

📝 *Descreva o problema:*

Exemplos:
• Computador não liga
• Internet lenta  
• Email não funciona', null, null),

((SELECT id FROM whatsapp_flows WHERE name = 'Criar Chamado de Suporte'), 2, 'input', 'problema', null, 'text', null),

((SELECT id FROM whatsapp_flows WHERE name = 'Criar Chamado de Suporte'), 3, 'message', 'prioridade', '✅ Problema registrado!

⚡ *Qual a urgência?*

1️⃣ 🔴 Urgente
2️⃣ 🟡 Normal  
3️⃣ 🟢 Baixa

*Digite 1, 2 ou 3:*', null, null),

((SELECT id FROM whatsapp_flows WHERE name = 'Criar Chamado de Suporte'), 4, 'input', 'prioridade_escolha', null, 'options', null),

((SELECT id FROM whatsapp_flows WHERE name = 'Criar Chamado de Suporte'), 5, 'action', 'criar_ticket', '🎉 *CHAMADO CRIADO!*

🎫 Número: *#{ticket_number}*
📝 {problema}
⚡ Prioridade: {prioridade}

✅ Nossa equipe foi notificada!

📱 *Digite qualquer mensagem para criar outro chamado*', null, null);

-- Atualizar referências next_step_success
UPDATE public.whatsapp_flow_steps SET next_step_success = (
  SELECT id FROM whatsapp_flow_steps ws2 
  WHERE ws2.flow_id = whatsapp_flow_steps.flow_id 
  AND ws2.step_order = whatsapp_flow_steps.step_order + 1
) WHERE step_order < 5;

-- Configurar opções para prioridade
UPDATE public.whatsapp_flow_steps 
SET input_options = '[
  {"value": "alta", "label": "🔴 Urgente", "key": "1"},
  {"value": "media", "label": "🟡 Normal", "key": "2"}, 
  {"value": "baixa", "label": "🟢 Baixa", "key": "3"}
]'::jsonb,
actions = '{"ticket": {"category": "outros", "create_user_if_needed": true}}'::jsonb
WHERE step_name IN ('prioridade_escolha', 'criar_ticket');