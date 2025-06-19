
-- Habilitar RLS nas tabelas de chat se não estiver habilitado
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Criar função para verificar se o usuário pode ver uma sala de chat
CREATE OR REPLACE FUNCTION public.can_access_chat_room(room_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    LEFT JOIN public.profiles p ON p.id = user_id
    LEFT JOIN public.chat_participants cp ON cp.room_id = cr.id AND cp.user_id = user_id
    WHERE cr.id = room_id 
    AND cr.is_active = true
    AND (
      -- Admin vê todas as salas
      p.role = 'admin'
      -- Usuário é participante direto
      OR cp.user_id IS NOT NULL
      -- Sala geral (sem unidade específica)
      OR cr.unit_id IS NULL
      -- Sala da mesma unidade do usuário
      OR cr.unit_id = p.unit_id
      -- Técnico pode ver salas de suas unidades
      OR (p.role = 'technician' AND EXISTS (
        SELECT 1 FROM public.technician_units tu 
        WHERE tu.technician_id = p.id AND tu.unit_id = cr.unit_id
      ))
      -- Criador da sala
      OR cr.created_by = user_id
    )
  );
$$;

-- Políticas para chat_rooms
DROP POLICY IF EXISTS "Users can view accessible chat rooms" ON public.chat_rooms;
CREATE POLICY "Users can view accessible chat rooms"
ON public.chat_rooms
FOR SELECT
TO authenticated
USING (public.can_access_chat_room(id, auth.uid()));

DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;
CREATE POLICY "Users can create chat rooms"
ON public.chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Room creators and admins can update rooms" ON public.chat_rooms;
CREATE POLICY "Room creators and admins can update rooms"
ON public.chat_rooms
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() 
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Políticas para chat_participants
DROP POLICY IF EXISTS "Users can view participants of accessible rooms" ON public.chat_participants;
CREATE POLICY "Users can view participants of accessible rooms"
ON public.chat_participants
FOR SELECT
TO authenticated
USING (public.can_access_chat_room(room_id, auth.uid()));

DROP POLICY IF EXISTS "Users can add participants to their rooms" ON public.chat_participants;
CREATE POLICY "Users can add participants to their rooms"
ON public.chat_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_rooms 
    WHERE id = room_id 
    AND (
      created_by = auth.uid() 
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  )
);

DROP POLICY IF EXISTS "Users can remove participants from their rooms" ON public.chat_participants;
CREATE POLICY "Users can remove participants from their rooms"
ON public.chat_participants
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms 
    WHERE id = room_id 
    AND (
      created_by = auth.uid() 
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  )
);

-- Políticas para chat_messages
DROP POLICY IF EXISTS "Users can view messages in accessible rooms" ON public.chat_messages;
CREATE POLICY "Users can view messages in accessible rooms"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (public.can_access_chat_room(room_id, auth.uid()));

DROP POLICY IF EXISTS "Users can send messages to accessible rooms" ON public.chat_messages;
CREATE POLICY "Users can send messages to accessible rooms"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() 
  AND public.can_access_chat_room(room_id, auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;
CREATE POLICY "Users can update their own messages"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid() 
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Função para adicionar automaticamente participantes baseado na unidade
CREATE OR REPLACE FUNCTION public.auto_add_unit_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se a sala tem uma unidade específica, adicionar todos os usuários dessa unidade
  IF NEW.unit_id IS NOT NULL THEN
    INSERT INTO public.chat_participants (room_id, user_id)
    SELECT NEW.id, p.id
    FROM public.profiles p
    WHERE p.unit_id = NEW.unit_id
    AND p.status = 'ativo'
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.room_id = NEW.id AND cp.user_id = p.id
    );
  END IF;
  
  -- Sempre adicionar o criador como participante
  INSERT INTO public.chat_participants (room_id, user_id)
  VALUES (NEW.id, NEW.created_by)
  ON CONFLICT (room_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para adicionar participantes automaticamente
DROP TRIGGER IF EXISTS auto_add_participants_trigger ON public.chat_rooms;
CREATE TRIGGER auto_add_participants_trigger
  AFTER INSERT ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_unit_participants();

-- Adicionar constraint unique para evitar participantes duplicados
ALTER TABLE public.chat_participants 
DROP CONSTRAINT IF EXISTS chat_participants_room_user_unique;
ALTER TABLE public.chat_participants 
ADD CONSTRAINT chat_participants_room_user_unique UNIQUE (room_id, user_id);
