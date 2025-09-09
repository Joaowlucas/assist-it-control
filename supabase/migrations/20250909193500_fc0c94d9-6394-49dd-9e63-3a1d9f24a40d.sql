-- Adicionar colunas para integrar tarefas com equipamentos e tickets
ALTER TABLE public.kanban_tasks 
ADD COLUMN equipment_id uuid REFERENCES public.equipment(id) ON DELETE SET NULL,
ADD COLUMN ticket_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL,
ADD COLUMN task_type text NOT NULL DEFAULT 'custom';

-- Criar índices para melhor performance
CREATE INDEX idx_kanban_tasks_equipment_id ON public.kanban_tasks(equipment_id);
CREATE INDEX idx_kanban_tasks_ticket_id ON public.kanban_tasks(ticket_id);
CREATE INDEX idx_kanban_tasks_task_type ON public.kanban_tasks(task_type);

-- Adicionar comentário para documentar os tipos de tarefa
COMMENT ON COLUMN public.kanban_tasks.task_type IS 'Tipos: custom (personalizada), equipment (baseada em equipamento), ticket (baseada em chamado)';
COMMENT ON COLUMN public.kanban_tasks.equipment_id IS 'ID do equipamento relacionado (opcional)';
COMMENT ON COLUMN public.kanban_tasks.ticket_id IS 'ID do ticket relacionado (opcional)';