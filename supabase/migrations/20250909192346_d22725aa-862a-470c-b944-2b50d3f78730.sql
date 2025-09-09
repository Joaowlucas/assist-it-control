-- Drop existing problematic policies
DROP POLICY IF EXISTS "Board creators and participants can view boards" ON public.kanban_boards;
DROP POLICY IF EXISTS "Users can view board participants" ON public.kanban_board_participants;
DROP POLICY IF EXISTS "Board creators can manage participants" ON public.kanban_board_participants;

-- Create a security definer function to check board access
CREATE OR REPLACE FUNCTION public.user_can_access_board(board_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM kanban_boards kb
    WHERE kb.id = board_id 
    AND (
      kb.created_by = user_id OR
      get_user_role(user_id) = 'admin' OR
      (kb.is_unit_wide AND EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = user_id AND p.unit_id = kb.unit_id
      ))
    )
  );
$$;

-- Simplified kanban_boards policies without circular dependency
CREATE POLICY "Board creators and unit members can view boards" ON public.kanban_boards
FOR SELECT USING (
  created_by = auth.uid() OR
  get_user_role(auth.uid()) = 'admin' OR
  (is_unit_wide AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND unit_id = kanban_boards.unit_id
  ))
);

-- Simplified kanban_board_participants policies
CREATE POLICY "Users can view board participants if they can access the board" ON public.kanban_board_participants
FOR SELECT USING (
  user_can_access_board(board_id, auth.uid()) OR user_id = auth.uid()
);

CREATE POLICY "Board owners and admins can manage participants" ON public.kanban_board_participants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM kanban_boards kb 
    WHERE kb.id = board_id AND (
      kb.created_by = auth.uid() OR 
      get_user_role(auth.uid()) = 'admin'
    )
  )
);

-- Fix kanban_tasks policies to avoid potential issues
DROP POLICY IF EXISTS "Users can create tasks in accessible boards" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Users can view tasks from accessible boards" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Users can update tasks in accessible boards" ON public.kanban_tasks;

CREATE POLICY "Users can create tasks in accessible boards" ON public.kanban_tasks
FOR INSERT WITH CHECK (
  created_by = auth.uid() AND
  user_can_access_board(board_id, auth.uid())
);

CREATE POLICY "Users can view tasks from accessible boards" ON public.kanban_tasks
FOR SELECT USING (
  user_can_access_board(board_id, auth.uid())
);

CREATE POLICY "Users can update tasks in accessible boards" ON public.kanban_tasks
FOR UPDATE USING (
  user_can_access_board(board_id, auth.uid()) AND (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    get_user_role(auth.uid()) = 'admin'
  )
);