
-- ETAPA 1: CORREÇÃO DEFINITIVA DAS POLÍTICAS RLS
-- Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "chat_rooms_select_simple" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_insert_simple" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_update_simple" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_participants_select_simple" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_insert_simple" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_delete_simple" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_messages_select_simple" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_simple" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_update_simple" ON public.chat_messages;

-- Remover funções existentes
DROP FUNCTION IF EXISTS public.get_current_user_role_simple();
DROP FUNCTION IF EXISTS public.get_current_user_unit();

-- Criar funções DEFINITIVAMENTE seguras
CREATE OR REPLACE FUNCTION public.get_user_role_safe()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_unit_safe()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unit_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Criar políticas RLS ULTRA SIMPLES para chat_rooms
CREATE POLICY "rooms_select_final"
ON public.chat_rooms FOR SELECT
TO authenticated
USING (
  is_active = true AND (
    created_by = auth.uid()
    OR public.get_user_role_safe() = 'admin'
    OR EXISTS (SELECT 1 FROM chat_participants WHERE room_id = id AND user_id = auth.uid())
    OR (type = 'unit' AND unit_id = public.get_user_unit_safe())
    OR (type = 'group' AND public.get_user_unit_safe() = ANY(selected_units))
    OR (type = 'unit' AND public.get_user_role_safe() = 'technician' AND EXISTS (
      SELECT 1 FROM technician_units WHERE technician_id = auth.uid() AND unit_id = chat_rooms.unit_id
    ))
    OR (type = 'group' AND public.get_user_role_safe() = 'technician' AND EXISTS (
      SELECT 1 FROM technician_units tu WHERE tu.technician_id = auth.uid() AND tu.unit_id = ANY(selected_units)
    ))
  )
);

CREATE POLICY "rooms_insert_final"
ON public.chat_rooms FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "rooms_update_final"
ON public.chat_rooms FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR public.get_user_role_safe() = 'admin');

-- Criar políticas RLS ULTRA SIMPLES para chat_participants
CREATE POLICY "participants_select_final"
ON public.chat_participants FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_user_role_safe() = 'admin'
  OR EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND created_by = auth.uid())
);

CREATE POLICY "participants_insert_final"
ON public.chat_participants FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.get_user_role_safe() = 'admin'
  OR EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND created_by = auth.uid())
);

CREATE POLICY "participants_delete_final"
ON public.chat_participants FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_user_role_safe() = 'admin'
  OR EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND created_by = auth.uid())
);

-- Criar políticas RLS ULTRA SIMPLES para chat_messages
CREATE POLICY "messages_select_final"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM chat_participants WHERE room_id = chat_messages.room_id AND user_id = auth.uid())
  OR public.get_user_role_safe() = 'admin'
);

CREATE POLICY "messages_insert_final"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (SELECT 1 FROM chat_participants WHERE room_id = chat_messages.room_id AND user_id = auth.uid())
);

CREATE POLICY "messages_update_final"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid() OR public.get_user_role_safe() = 'admin');

-- Garantir RLS habilitado
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Atualizar função para obter usuários disponíveis (simplificar)
CREATE OR REPLACE FUNCTION public.get_available_chat_users_final(requesting_user_id uuid)
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
  SELECT p.role, p.unit_id INTO user_role, user_unit_id
  FROM profiles p WHERE p.id = requesting_user_id;
  
  IF user_role = 'admin' THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role, p.unit_id, p.avatar_url, u.name as unit_name
    FROM profiles p
    LEFT JOIN units u ON u.id = p.unit_id
    WHERE p.status = 'ativo' AND p.id != requesting_user_id
    ORDER BY p.name;
    
  ELSIF user_role = 'technician' THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role, p.unit_id, p.avatar_url, u.name as unit_name
    FROM profiles p
    LEFT JOIN units u ON u.id = p.unit_id
    WHERE p.status = 'ativo' 
    AND p.id != requesting_user_id
    AND (
      p.role = 'admin'
      OR p.unit_id IN (SELECT tu.unit_id FROM technician_units tu WHERE tu.technician_id = requesting_user_id)
      OR p.unit_id = user_unit_id
    )
    ORDER BY p.name;
    
  ELSE
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role, p.unit_id, p.avatar_url, u.name as unit_name
    FROM profiles p
    LEFT JOIN units u ON u.id = p.unit_id
    WHERE p.status = 'ativo' 
    AND p.id != requesting_user_id
    AND (
      p.role = 'admin'
      OR (p.role = 'technician' AND (
        p.unit_id = user_unit_id
        OR EXISTS (SELECT 1 FROM technician_units tu WHERE tu.technician_id = p.id AND tu.unit_id = user_unit_id)
      ))
    )
    ORDER BY p.name;
  END IF;
END;
$$;

-- Criar storage bucket para chat attachments se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Política de storage para chat attachments
CREATE POLICY "Chat attachments upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Chat attachments download"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');
