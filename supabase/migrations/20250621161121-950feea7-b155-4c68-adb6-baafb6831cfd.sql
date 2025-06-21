
-- Remover TODAS as políticas RLS existentes para evitar recursão
DROP POLICY IF EXISTS "Users can view accessible chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Admins and creators can update rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view participants of accessible rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can join accessible rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can leave rooms or admins can manage" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view messages in accessible rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to accessible rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can edit own messages or admins can edit any" ON public.chat_messages;

-- Criar função SECURITY DEFINER para evitar recursão RLS
CREATE OR REPLACE FUNCTION public.get_current_user_info()
RETURNS TABLE(user_id uuid, user_role text, user_unit_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id, role::text, unit_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Função para verificar se usuário pode acessar uma sala
CREATE OR REPLACE FUNCTION public.can_user_access_room(room_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  current_user_id uuid;
  current_user_role text;
  current_user_unit_id uuid;
  room_type chat_type;
  room_unit_id uuid;
  room_selected_units uuid[];
BEGIN
  -- Obter dados do usuário atual
  SELECT user_id, user_role, user_unit_id 
  INTO current_user_id, current_user_role, current_user_unit_id
  FROM public.get_current_user_info();
  
  -- Se não encontrou usuário, não pode acessar
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Admin pode acessar qualquer sala
  IF current_user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Obter dados da sala
  SELECT type, unit_id, selected_units 
  INTO room_type, room_unit_id, room_selected_units
  FROM public.chat_rooms 
  WHERE id = room_id AND is_active = true;
  
  -- Se não encontrou a sala, não pode acessar
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Verificar se é participante direto (para todas as salas)
  IF EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE room_id = can_user_access_room.room_id AND user_id = current_user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Para salas privadas, apenas participantes diretos
  IF room_type = 'private' THEN
    RETURN false;
  END IF;
  
  -- Para salas de unidade
  IF room_type = 'unit' AND room_unit_id IS NOT NULL THEN
    -- Usuário da mesma unidade
    IF current_user_unit_id = room_unit_id THEN
      RETURN true;
    END IF;
    
    -- Técnico que atende essa unidade
    IF current_user_role = 'technician' AND EXISTS (
      SELECT 1 FROM public.technician_units 
      WHERE technician_id = current_user_id AND unit_id = room_unit_id
    ) THEN
      RETURN true;
    END IF;
  END IF;
  
  -- Para grupos com unidades selecionadas
  IF room_type = 'group' AND room_selected_units IS NOT NULL AND array_length(room_selected_units, 1) > 0 THEN
    -- Usuário de unidade selecionada
    IF current_user_unit_id = ANY(room_selected_units) THEN
      RETURN true;
    END IF;
    
    -- Técnico que atende alguma unidade selecionada
    IF current_user_role = 'technician' AND EXISTS (
      SELECT 1 FROM public.technician_units 
      WHERE technician_id = current_user_id AND unit_id = ANY(room_selected_units)
    ) THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$;

-- Função para obter usuários disponíveis para chat (sem recursão RLS)
CREATE OR REPLACE FUNCTION public.get_available_chat_users_safe()
RETURNS TABLE(
  id uuid, 
  name text, 
  email text, 
  role text, 
  unit_id uuid, 
  avatar_url text, 
  unit_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  current_user_id uuid;
  current_user_role text;
  current_user_unit_id uuid;
BEGIN
  -- Obter dados do usuário atual
  SELECT user_id, user_role, user_unit_id 
  INTO current_user_id, current_user_role, current_user_unit_id
  FROM public.get_current_user_info();
  
  -- Se não encontrou usuário, retornar vazio
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Admin pode conversar com qualquer um
  IF current_user_role = 'admin' THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p.unit_id, p.avatar_url, u.name as unit_name
    FROM public.profiles p
    LEFT JOIN public.units u ON u.id = p.unit_id
    WHERE p.status = 'ativo' AND p.id != current_user_id
    ORDER BY p.name;
    
  -- Técnico pode conversar com admins e usuários das unidades que atende
  ELSIF current_user_role = 'technician' THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p.unit_id, p.avatar_url, u.name as unit_name
    FROM public.profiles p
    LEFT JOIN public.units u ON u.id = p.unit_id
    WHERE p.status = 'ativo' 
    AND p.id != current_user_id
    AND (
      p.role::text = 'admin'
      OR p.unit_id IN (
        SELECT tu.unit_id FROM public.technician_units tu 
        WHERE tu.technician_id = current_user_id
      )
      OR p.unit_id = current_user_unit_id
    )
    ORDER BY p.name;
    
  -- Usuário comum pode conversar com admins e técnicos da sua unidade
  ELSE
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p.unit_id, p.avatar_url, u.name as unit_name
    FROM public.profiles p
    LEFT JOIN public.units u ON u.id = p.unit_id
    WHERE p.status = 'ativo' 
    AND p.id != current_user_id
    AND (
      p.role::text = 'admin'
      OR (p.role::text = 'technician' AND (
        p.unit_id = current_user_unit_id
        OR EXISTS (
          SELECT 1 FROM public.technician_units tu 
          WHERE tu.technician_id = p.id AND tu.unit_id = current_user_unit_id
        )
      ))
    )
    ORDER BY p.name;
  END IF;
END;
$$;

-- POLÍTICAS RLS ULTRA-SIMPLES (sem recursão)
CREATE POLICY "Simple chat rooms access"
ON public.chat_rooms FOR SELECT
TO authenticated
USING (public.can_user_access_room(id));

CREATE POLICY "Simple chat rooms insert"
ON public.chat_rooms FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Simple chat rooms update"
ON public.chat_rooms FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() 
  OR (SELECT user_role FROM public.get_current_user_info()) = 'admin'
);

CREATE POLICY "Simple participants access"
ON public.chat_participants FOR SELECT
TO authenticated
USING (public.can_user_access_room(room_id));

CREATE POLICY "Simple participants insert"
ON public.chat_participants FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND public.can_user_access_room(room_id)
);

CREATE POLICY "Simple participants delete"
ON public.chat_participants FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() 
  OR (SELECT user_role FROM public.get_current_user_info()) = 'admin'
);

CREATE POLICY "Simple messages access"
ON public.chat_messages FOR SELECT
TO authenticated
USING (public.can_user_access_room(room_id));

CREATE POLICY "Simple messages insert"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() 
  AND public.can_user_access_room(room_id)
);

CREATE POLICY "Simple messages update"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid() 
  OR (SELECT user_role FROM public.get_current_user_info()) = 'admin'
);

-- Garantir que RLS está habilitado
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_room ON public.chat_participants(user_id, room_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_active_type ON public.chat_rooms(is_active, type) WHERE is_active = true;
