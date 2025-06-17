
-- Criar tabela para salas de chat
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unit_id UUID REFERENCES public.units(id),
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Criar tabela para mensagens do chat
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para participantes das salas
CREATE TABLE public.chat_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Criar tabela para conteúdo da landing page
CREATE TABLE public.landing_page_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('image', 'announcement')),
  title TEXT,
  content TEXT,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campos para landing page nas configurações do sistema
ALTER TABLE public.system_settings 
ADD COLUMN landing_page_enabled BOOLEAN DEFAULT true,
ADD COLUMN landing_page_title TEXT DEFAULT 'Bem-vindo ao Sistema de Suporte TI',
ADD COLUMN landing_page_subtitle TEXT DEFAULT 'Gerencie equipamentos, chamados e muito mais';

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_content ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chat_rooms
CREATE POLICY "Users can view rooms they participate in" ON public.chat_rooms
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.chat_participants WHERE room_id = chat_rooms.id
    ) OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'technician')
    )
  );

-- Políticas RLS para chat_messages
CREATE POLICY "Users can view messages in their rooms" ON public.chat_messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.chat_participants WHERE room_id = chat_messages.room_id
    )
  );

CREATE POLICY "Users can send messages to their rooms" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.chat_participants WHERE room_id = chat_messages.room_id
    ) AND sender_id = auth.uid()
  );

-- Políticas RLS para chat_participants
CREATE POLICY "Users can view participants in their rooms" ON public.chat_participants
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT user_id FROM public.chat_participants cp WHERE cp.room_id = chat_participants.room_id
    )
  );

CREATE POLICY "Admins can manage participants" ON public.chat_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'technician')
    )
  );

-- Políticas RLS para landing_page_content (apenas admins podem gerenciar)
CREATE POLICY "Anyone can view active landing page content" ON public.landing_page_content
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage landing page content" ON public.landing_page_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON public.chat_rooms
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_landing_page_content_updated_at BEFORE UPDATE ON public.landing_page_content
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Habilitar realtime para chat
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_participants REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;
