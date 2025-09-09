-- Create kanban_columns table for custom columns
CREATE TABLE public.kanban_columns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id uuid NOT NULL REFERENCES public.kanban_boards(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'bg-slate-100',
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;

-- Create policies for kanban_columns
CREATE POLICY "Users can view columns from accessible boards" ON public.kanban_columns
FOR SELECT USING (
  user_can_access_board(board_id, auth.uid())
);

CREATE POLICY "Board owners can manage columns" ON public.kanban_columns
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM kanban_boards kb 
    WHERE kb.id = board_id AND (
      kb.created_by = auth.uid() OR 
      get_user_role(auth.uid()) = 'admin'
    )
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_kanban_columns_updated_at
BEFORE UPDATE ON public.kanban_columns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Modify kanban_tasks to use text status instead of enum
-- First, update existing tasks to use the new column structure
UPDATE public.kanban_tasks SET status = 'A Fazer' WHERE status = 'todo';
UPDATE public.kanban_tasks SET status = 'Em Progresso' WHERE status = 'in_progress';
UPDATE public.kanban_tasks SET status = 'Concluído' WHERE status = 'done';