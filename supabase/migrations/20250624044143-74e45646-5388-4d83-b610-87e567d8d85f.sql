
-- Habilitar RLS na tabela whatsapp_notifications se ainda não estiver habilitado
ALTER TABLE public.whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- Política para permitir que admins e técnicos insiram notificações
CREATE POLICY "Admins and technicians can insert whatsapp notifications" 
ON public.whatsapp_notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'technician')
  )
);

-- Política para permitir que usuários vejam suas próprias notificações ou que admins/técnicos vejam todas
CREATE POLICY "Users can view whatsapp notifications" 
ON public.whatsapp_notifications 
FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'technician')
  )
);

-- Política para permitir que admins e técnicos atualizem status das notificações
CREATE POLICY "Admins and technicians can update whatsapp notifications" 
ON public.whatsapp_notifications 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'technician')
  )
);
