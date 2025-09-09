-- Criar tabela de quadros kanban
CREATE TABLE public.kanban_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  unit_id UUID,
  is_unit_wide BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de participantes dos quadros
CREATE TABLE public.kanban_board_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- member, editor, admin
  added_by UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(board_id, user_id)
);

-- Criar tabela de tarefas/cards
CREATE TABLE public.kanban_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo', -- todo, in_progress, done
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  assigned_to UUID,
  created_by UUID NOT NULL,
  due_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  labels JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_board_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;

-- Políticas para kanban_boards
CREATE POLICY "Users can create boards" ON public.kanban_boards
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Board creators and participants can view boards" ON public.kanban_boards
FOR SELECT USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM kanban_board_participants 
    WHERE board_id = id AND user_id = auth.uid()
  ) OR
  (is_unit_wide AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND unit_id = kanban_boards.unit_id
  )) OR
  get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Board creators can update boards" ON public.kanban_boards
FOR UPDATE USING (
  created_by = auth.uid() OR
  get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Board creators can delete boards" ON public.kanban_boards
FOR DELETE USING (
  created_by = auth.uid() OR
  get_user_role(auth.uid()) = 'admin'
);

-- Políticas para kanban_board_participants
CREATE POLICY "Board creators can manage participants" ON public.kanban_board_participants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM kanban_boards kb 
    WHERE kb.id = board_id AND (kb.created_by = auth.uid() OR get_user_role(auth.uid()) = 'admin')
  )
);

CREATE POLICY "Users can view board participants" ON public.kanban_board_participants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM kanban_boards kb 
    WHERE kb.id = board_id AND (
      kb.created_by = auth.uid() OR
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM kanban_board_participants kbp2
        WHERE kbp2.board_id = board_id AND kbp2.user_id = auth.uid()
      ) OR
      get_user_role(auth.uid()) = 'admin'
    )
  )
);

-- Políticas para kanban_tasks
CREATE POLICY "Users can create tasks in accessible boards" ON public.kanban_tasks
FOR INSERT WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM kanban_boards kb 
    WHERE kb.id = board_id AND (
      kb.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM kanban_board_participants 
        WHERE board_id = kb.id AND user_id = auth.uid()
      ) OR
      (kb.is_unit_wide AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND unit_id = kb.unit_id
      )) OR
      get_user_role(auth.uid()) = 'admin'
    )
  )
);

CREATE POLICY "Users can view tasks from accessible boards" ON public.kanban_tasks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM kanban_boards kb 
    WHERE kb.id = board_id AND (
      kb.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM kanban_board_participants 
        WHERE board_id = kb.id AND user_id = auth.uid()
      ) OR
      (kb.is_unit_wide AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND unit_id = kb.unit_id
      )) OR
      get_user_role(auth.uid()) = 'admin'
    )
  )
);

CREATE POLICY "Users can update tasks in accessible boards" ON public.kanban_tasks
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM kanban_boards kb 
    WHERE kb.id = board_id AND (
      kb.created_by = auth.uid() OR
      created_by = auth.uid() OR
      assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM kanban_board_participants 
        WHERE board_id = kb.id AND user_id = auth.uid()
      ) OR
      get_user_role(auth.uid()) = 'admin'
    )
  )
);

CREATE POLICY "Users can delete their own tasks or board creators can delete" ON public.kanban_tasks
FOR DELETE USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM kanban_boards kb 
    WHERE kb.id = board_id AND (kb.created_by = auth.uid() OR get_user_role(auth.uid()) = 'admin')
  )
);

-- Triggers para updated_at
CREATE TRIGGER update_kanban_boards_updated_at
  BEFORE UPDATE ON public.kanban_boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kanban_tasks_updated_at
  BEFORE UPDATE ON public.kanban_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();