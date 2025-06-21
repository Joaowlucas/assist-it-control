
-- Corrigir as políticas RLS para chat_rooms para garantir visibilidade adequada
DROP POLICY IF EXISTS "Users can view accessible chat rooms" ON public.chat_rooms;

CREATE POLICY "Users can view accessible chat rooms"
ON public.chat_rooms FOR SELECT
TO authenticated
USING (
  is_active = true AND (
    -- Admin pode ver todas as salas
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR
    -- Usuário é participante direto
    EXISTS (
      SELECT 1 FROM public.chat_participants 
      WHERE room_id = chat_rooms.id AND user_id = auth.uid()
    )
    OR
    -- Para salas de unidade: usuário da mesma unidade ou técnico que atende
    (
      type = 'unit' AND unit_id IS NOT NULL AND (
        (SELECT unit_id FROM public.profiles WHERE id = auth.uid()) = unit_id
        OR
        EXISTS (
          SELECT 1 FROM public.technician_units tu
          WHERE tu.technician_id = auth.uid() AND tu.unit_id = chat_rooms.unit_id
        )
      )
    )
    OR
    -- Para grupos: usuário de unidade selecionada ou técnico que atende
    (
      type = 'group' AND selected_units IS NOT NULL AND (
        (SELECT unit_id FROM public.profiles WHERE id = auth.uid()) = ANY(selected_units)
        OR
        EXISTS (
          SELECT 1 FROM public.technician_units tu
          WHERE tu.technician_id = auth.uid() AND tu.unit_id = ANY(selected_units)
        )
      )
    )
  )
);

-- Melhorar a função para buscar usuários disponíveis para chat
CREATE OR REPLACE FUNCTION public.get_available_chat_users(requesting_user_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  role user_role,
  unit_id uuid,
  avatar_url text,
  unit_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role user_role;
  user_unit_id uuid;
BEGIN
  -- Buscar dados do usuário solicitante
  SELECT p.role, p.unit_id INTO user_role, user_unit_id
  FROM public.profiles p WHERE p.id = requesting_user_id;
  
  -- Admin pode conversar com qualquer um
  IF user_role = 'admin' THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role, p.unit_id, p.avatar_url, u.name as unit_name
    FROM public.profiles p
    LEFT JOIN public.units u ON u.id = p.unit_id
    WHERE p.status = 'ativo' AND p.id != requesting_user_id
    ORDER BY p.name;
    
  -- Técnico pode conversar com admins e usuários das unidades que atende
  ELSIF user_role = 'technician' THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role, p.unit_id, p.avatar_url, u.name as unit_name
    FROM public.profiles p
    LEFT JOIN public.units u ON u.id = p.unit_id
    WHERE p.status = 'ativo' 
    AND p.id != requesting_user_id
    AND (
      p.role = 'admin'
      OR p.unit_id IN (
        SELECT tu.unit_id FROM public.technician_units tu 
        WHERE tu.technician_id = requesting_user_id
      )
      OR p.unit_id = user_unit_id
    )
    ORDER BY p.name;
    
  -- Usuário comum pode conversar com admins e técnicos da sua unidade
  ELSE
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role, p.unit_id, p.avatar_url, u.name as unit_name
    FROM public.profiles p
    LEFT JOIN public.units u ON u.id = p.unit_id
    WHERE p.status = 'ativo' 
    AND p.id != requesting_user_id
    AND (
      p.role = 'admin'
      OR (p.role = 'technician' AND (
        p.unit_id = user_unit_id
        OR EXISTS (
          SELECT 1 FROM public.technician_units tu 
          WHERE tu.technician_id = p.id AND tu.unit_id = user_unit_id
        )
      ))
    )
    ORDER BY p.name;
  END IF;
END;
$$;

-- Função para verificar se já existe conversa entre dois usuários
CREATE OR REPLACE FUNCTION public.find_existing_private_chat(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  existing_room_id uuid;
BEGIN
  -- Buscar sala privada existente entre os dois usuários
  SELECT cr.id INTO existing_room_id
  FROM public.chat_rooms cr
  WHERE cr.type = 'private' 
  AND cr.is_active = true
  AND EXISTS (
    SELECT 1 FROM public.chat_participants cp1 
    WHERE cp1.room_id = cr.id AND cp1.user_id = user1_id
  )
  AND EXISTS (
    SELECT 1 FROM public.chat_participants cp2 
    WHERE cp2.room_id = cr.id AND cp2.user_id = user2_id
  )
  AND (
    SELECT COUNT(*) FROM public.chat_participants cp 
    WHERE cp.room_id = cr.id
  ) = 2;
  
  RETURN existing_room_id;
END;
$$;
