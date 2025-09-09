-- Adicionar foreign keys para relacionamentos corretos na tabela kanban_tasks
ALTER TABLE kanban_tasks 
ADD CONSTRAINT fk_kanban_tasks_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE kanban_tasks 
ADD CONSTRAINT fk_kanban_tasks_created_by 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Adicionar foreign key para relacionamento na tabela kanban_board_participants
ALTER TABLE kanban_board_participants 
ADD CONSTRAINT fk_kanban_board_participants_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE kanban_board_participants 
ADD CONSTRAINT fk_kanban_board_participants_added_by 
FOREIGN KEY (added_by) REFERENCES profiles(id) ON DELETE CASCADE;