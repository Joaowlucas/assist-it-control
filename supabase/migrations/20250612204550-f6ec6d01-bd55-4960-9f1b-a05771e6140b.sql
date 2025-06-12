
-- Criar enum para roles de usuário
CREATE TYPE public.user_role AS ENUM ('admin', 'technician', 'user');

-- Criar enum para status de equipamentos
CREATE TYPE public.equipment_status AS ENUM ('disponivel', 'em_uso', 'manutencao', 'descartado');

-- Criar enum para prioridades de chamados
CREATE TYPE public.ticket_priority AS ENUM ('baixa', 'media', 'alta', 'critica');

-- Criar enum para status de chamados
CREATE TYPE public.ticket_status AS ENUM ('aberto', 'em_andamento', 'aguardando', 'fechado');

-- Criar enum para categorias de chamados
CREATE TYPE public.ticket_category AS ENUM ('hardware', 'software', 'rede', 'acesso', 'outros');

-- Criar enum para status de atribuições
CREATE TYPE public.assignment_status AS ENUM ('ativo', 'finalizado');

-- Tabela de unidades
CREATE TABLE public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    unit_id UUID REFERENCES public.units(id),
    status TEXT NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de equipamentos
CREATE TABLE public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    serial_number TEXT UNIQUE,
    description TEXT,
    status equipment_status NOT NULL DEFAULT 'disponivel',
    unit_id UUID REFERENCES public.units(id),
    purchase_date DATE,
    warranty_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de chamados
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority ticket_priority NOT NULL DEFAULT 'media',
    status ticket_status NOT NULL DEFAULT 'aberto',
    category ticket_category NOT NULL,
    requester_id UUID REFERENCES public.profiles(id) NOT NULL,
    assignee_id UUID REFERENCES public.profiles(id),
    unit_id UUID REFERENCES public.units(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de comentários dos chamados
CREATE TABLE public.ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de atribuições de equipamentos
CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES public.equipment(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    assigned_by UUID REFERENCES public.profiles(id) NOT NULL,
    status assignment_status NOT NULL DEFAULT 'ativo',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir unidades padrão
INSERT INTO public.units (name, description) VALUES 
('Matriz São Paulo', 'Sede principal da empresa'),
('Filial Rio de Janeiro', 'Filial no Rio de Janeiro'),
('TI', 'Departamento de Tecnologia da Informação');

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role, unit_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email,
        'user',
        (SELECT id FROM public.units WHERE name = 'Matriz São Paulo' LIMIT 1)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at (corrigido)
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Função para verificar role do usuário (evita recursão)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Políticas RLS para profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');

-- Políticas RLS para units
CREATE POLICY "Everyone can view units" ON public.units FOR SELECT USING (true);
CREATE POLICY "Admins can manage units" ON public.units FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Políticas RLS para equipment
CREATE POLICY "Everyone can view equipment" ON public.equipment FOR SELECT USING (true);
CREATE POLICY "Technicians and admins can manage equipment" ON public.equipment FOR ALL USING (
    public.get_user_role(auth.uid()) IN ('admin', 'technician')
);

-- Políticas RLS para tickets
CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT USING (
    requester_id = auth.uid() OR 
    assignee_id = auth.uid() OR 
    public.get_user_role(auth.uid()) IN ('admin', 'technician')
);
CREATE POLICY "Users can create tickets" ON public.tickets FOR INSERT WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Assignees and admins can update tickets" ON public.tickets FOR UPDATE USING (
    assignee_id = auth.uid() OR 
    public.get_user_role(auth.uid()) = 'admin'
);
CREATE POLICY "Admins can delete tickets" ON public.tickets FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');

-- Políticas RLS para ticket_comments
CREATE POLICY "Users can view comments of accessible tickets" ON public.ticket_comments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND (
            t.requester_id = auth.uid() OR 
            t.assignee_id = auth.uid() OR 
            public.get_user_role(auth.uid()) IN ('admin', 'technician')
        )
    )
);
CREATE POLICY "Users can create comments on accessible tickets" ON public.ticket_comments FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND (
            t.requester_id = auth.uid() OR 
            t.assignee_id = auth.uid() OR 
            public.get_user_role(auth.uid()) IN ('admin', 'technician')
        )
    )
);

-- Políticas RLS para assignments
CREATE POLICY "Users can view own assignments" ON public.assignments FOR SELECT USING (
    user_id = auth.uid() OR 
    public.get_user_role(auth.uid()) IN ('admin', 'technician')
);
CREATE POLICY "Technicians and admins can manage assignments" ON public.assignments FOR ALL USING (
    public.get_user_role(auth.uid()) IN ('admin', 'technician')
);

-- Criar índices para performance
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_unit_id ON public.profiles(unit_id);
CREATE INDEX idx_equipment_status ON public.equipment(status);
CREATE INDEX idx_equipment_unit_id ON public.equipment(unit_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_priority ON public.tickets(priority);
CREATE INDEX idx_tickets_requester_id ON public.tickets(requester_id);
CREATE INDEX idx_tickets_assignee_id ON public.tickets(assignee_id);
CREATE INDEX idx_tickets_unit_id ON public.tickets(unit_id);
CREATE INDEX idx_ticket_comments_ticket_id ON public.ticket_comments(ticket_id);
CREATE INDEX idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX idx_assignments_equipment_id ON public.assignments(equipment_id);
CREATE INDEX idx_assignments_status ON public.assignments(status);
