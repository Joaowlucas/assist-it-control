-- Limpar dados existentes que estão criando as colunas padrão
DELETE FROM public.kanban_tasks WHERE board_id IN (SELECT id FROM public.kanban_boards WHERE name = 'teste');

-- Inserir colunas padrão para o board de teste existente (para manter compatibilidade)
-- mas apenas se não existirem colunas ainda
DO $$
DECLARE
    board_record RECORD;
    column_count INTEGER;
BEGIN
    -- Para cada board existente que não tem colunas customizadas
    FOR board_record IN SELECT id FROM public.kanban_boards LOOP
        -- Verificar se já tem colunas customizadas
        SELECT COUNT(*) INTO column_count 
        FROM public.kanban_columns 
        WHERE board_id = board_record.id;
        
        -- Se não tem colunas, criar as padrão (apenas para boards existentes)
        IF column_count = 0 THEN
            INSERT INTO public.kanban_columns (board_id, name, color, position) VALUES
            (board_record.id, 'A Fazer', 'bg-slate-100', 0),
            (board_record.id, 'Em Progresso', 'bg-blue-100', 1),
            (board_record.id, 'Concluído', 'bg-green-100', 2);
        END IF;
    END LOOP;
END
$$;