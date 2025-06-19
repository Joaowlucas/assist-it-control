
-- Adicionar enum para tipos de chat
CREATE TYPE chat_type AS ENUM ('private', 'unit', 'group');

-- Adicionar colunas necessárias à tabela chat_rooms
ALTER TABLE public.chat_rooms 
ADD COLUMN IF NOT EXISTS type chat_type DEFAULT 'private',
ADD COLUMN IF NOT EXISTS selected_units uuid[] DEFAULT '{}';

-- Atualizar função de auto-participação para suportar grupos personalizados
CREATE OR REPLACE FUNCTION public.auto_add_unit_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sempre adicionar o criador como participante primeiro
  INSERT INTO public.chat_participants (room_id, user_id)
  VALUES (NEW.id, NEW.created_by)
  ON CONFLICT (room_id, user_id) DO NOTHING;
  
  -- Para salas de unidade específica
  IF NEW.type = 'unit' AND NEW.unit_id IS NOT NULL THEN
    -- Adicionar todos os usuários ativos dessa unidade
    INSERT INTO public.chat_participants (room_id, user_id)
    SELECT NEW.id, p.id
    FROM public.profiles p
    WHERE p.unit_id = NEW.unit_id
    AND p.status = 'ativo'
    AND p.id != NEW.created_by
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.room_id = NEW.id AND cp.user_id = p.id
    );
    
    -- Adicionar técnicos que atendem essa unidade
    INSERT INTO public.chat_participants (room_id, user_id)
    SELECT NEW.id, tu.technician_id
    FROM public.technician_units tu
    JOIN public.profiles p ON p.id = tu.technician_id
    WHERE tu.unit_id = NEW.unit_id
    AND p.status = 'ativo'
    AND tu.technician_id != NEW.created_by
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.room_id = NEW.id AND cp.user_id = tu.technician_id
    );
  END IF;
  
  -- Para grupos personalizados com unidades selecionadas
  IF NEW.type = 'group' AND array_length(NEW.selected_units, 1) > 0 THEN
    -- Adicionar usuários das unidades selecionadas
    INSERT INTO public.chat_participants (room_id, user_id)
    SELECT NEW.id, p.id
    FROM public.profiles p
    WHERE p.unit_id = ANY(NEW.selected_units)
    AND p.status = 'ativo'
    AND p.id != NEW.created_by
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.room_id = NEW.id AND cp.user_id = p.id
    );
    
    -- Adicionar técnicos que atendem essas unidades
    INSERT INTO public.chat_participants (room_id, user_id)
    SELECT NEW.id, tu.technician_id
    FROM public.technician_units tu
    JOIN public.profiles p ON p.id = tu.technician_id
    WHERE tu.unit_id = ANY(NEW.selected_units)
    AND p.status = 'ativo'
    AND tu.technician_id != NEW.created_by
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.room_id = NEW.id AND cp.user_id = tu.technician_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Atualizar políticas RLS para chat_rooms com melhor controle de acesso
DROP POLICY IF EXISTS "chat_rooms_select_policy" ON public.chat_rooms;

CREATE POLICY "chat_rooms_select_policy"
ON public.chat_rooms
FOR SELECT
TO authenticated
USING (
  -- Admin vê tudo
  public.get_user_role() = 'admin'
  -- Criador vê suas salas
  OR created_by = auth.uid()
  -- Participante vê salas onde participa (para grupos)
  OR public.is_participant(id)
  -- Para salas de unidade, usuários da mesma unidade
  OR (
    type = 'unit' 
    AND unit_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.unit_id = chat_rooms.unit_id
        OR (p.role = 'technician' AND EXISTS (
          SELECT 1 FROM public.technician_units tu 
          WHERE tu.technician_id = p.id AND tu.unit_id = chat_rooms.unit_id
        ))
      )
    )
  )
  -- Para grupos com unidades selecionadas, usuários dessas unidades
  OR (
    type = 'group'
    AND array_length(selected_units, 1) > 0
    AND EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.unit_id = ANY(selected_units)
        OR (p.role = 'technician' AND EXISTS (
          SELECT 1 FROM public.technician_units tu 
          WHERE tu.technician_id = p.id AND tu.unit_id = ANY(selected_units)
        ))
      )
    )
  )
);

-- Garantir que triggers estão ativos
DROP TRIGGER IF EXISTS chat_room_participants_trigger ON public.chat_rooms;
CREATE TRIGGER chat_room_participants_trigger
  AFTER INSERT ON public.chat_rooms
  FOR EACH ROW EXECUTE FUNCTION public.auto_add_unit_participants();
