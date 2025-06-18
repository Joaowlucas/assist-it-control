
-- Criar tabela para categorias de chamados
CREATE TABLE public.ticket_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para textos pré-definidos
CREATE TABLE public.predefined_texts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('title', 'description')),
  category TEXT,
  text_content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para templates de chamados
CREATE TABLE public.ticket_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
  title_template TEXT NOT NULL,
  description_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predefined_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para ticket_categories
CREATE POLICY "Everyone can view ticket categories" 
  ON public.ticket_categories 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage ticket categories" 
  ON public.ticket_categories 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para predefined_texts
CREATE POLICY "Everyone can view predefined texts" 
  ON public.predefined_texts 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage predefined texts" 
  ON public.predefined_texts 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para ticket_templates
CREATE POLICY "Everyone can view ticket templates" 
  ON public.ticket_templates 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage ticket templates" 
  ON public.ticket_templates 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_ticket_categories_updated_at 
  BEFORE UPDATE ON public.ticket_categories 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_predefined_texts_updated_at 
  BEFORE UPDATE ON public.predefined_texts 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_ticket_templates_updated_at 
  BEFORE UPDATE ON public.ticket_templates 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Inserir categorias padrão
INSERT INTO public.ticket_categories (name, description, is_default, is_active) VALUES
('hardware', 'Problemas relacionados a equipamentos físicos', true, true),
('software', 'Problemas com programas e aplicativos', true, true),
('rede', 'Problemas de conectividade e rede', true, true),
('acesso', 'Problemas de acesso e permissões', true, true),
('outros', 'Outros tipos de solicitações', true, true);

-- Inserir alguns textos pré-definidos de exemplo
INSERT INTO public.predefined_texts (type, category, text_content) VALUES
('title', 'hardware', 'Problema com impressora não funcionando'),
('title', 'hardware', 'Computador não liga'),
('title', 'software', 'Erro ao abrir aplicativo'),
('title', 'rede', 'Sem acesso à internet'),
('description', 'hardware', 'A impressora não está respondendo aos comandos de impressão. Já foi verificado se está ligada e conectada.'),
('description', 'software', 'O aplicativo apresenta erro ao tentar abrir. Mensagem de erro anexada em captura de tela.'),
('description', 'rede', 'Não consigo acessar sites da internet. A conexão com a rede local está funcionando normalmente.');

-- Inserir alguns templates de exemplo
INSERT INTO public.ticket_templates (name, category, priority, title_template, description_template) VALUES
('Problema Impressora', 'hardware', 'media', 'Problema com impressora [MODELO]', 'Descrever o problema específico com a impressora, incluindo modelo e mensagens de erro.'),
('Erro de Software', 'software', 'alta', 'Erro no sistema [NOME_SISTEMA]', 'Detalhar o erro encontrado, passos para reproduzir e impacto no trabalho.'),
('Problema de Rede', 'rede', 'alta', 'Sem acesso à rede/internet', 'Informar se o problema é local ou geral, equipamentos afetados e urgência.');
