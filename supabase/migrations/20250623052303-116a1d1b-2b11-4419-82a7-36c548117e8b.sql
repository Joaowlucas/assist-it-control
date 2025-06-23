
-- Criar enums para o sistema de chat
CREATE TYPE public.conversation_type AS ENUM ('direct', 'group');
CREATE TYPE public.message_status AS ENUM ('sent', 'delivered', 'read', 'edited', 'deleted');
CREATE TYPE public.attachment_type AS ENUM ('image', 'video', 'document', 'audio');
CREATE TYPE public.moderation_action AS ENUM ('delete_message', 'mute_user', 'ban_user', 'warning');

-- Tabela de conversas
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  type conversation_type NOT NULL DEFAULT 'direct',
  unit_id UUID REFERENCES public.units(id),
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  avatar_url TEXT
);

-- Tabela de participantes das conversas
CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  role TEXT DEFAULT 'member', -- 'admin', 'member'
  is_muted BOOLEAN DEFAULT false,
  muted_until TIMESTAMP WITH TIME ZONE,
  UNIQUE(conversation_id, user_id)
);

-- Tabela de mensagens do chat
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT,
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'video', 'document', 'audio'
  status message_status DEFAULT 'sent',
  reply_to_id UUID REFERENCES public.chat_messages(id),
  mentions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false
);

-- Tabela de anexos das mensagens
CREATE TABLE public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  attachment_type attachment_type NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- para áudios e vídeos em segundos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de controle de leitura das mensagens
CREATE TABLE public.message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Tabela de presença dos usuários
CREATE TABLE public.user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status TEXT DEFAULT 'offline', -- 'online', 'offline', 'away'
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_typing_in UUID REFERENCES public.conversations(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de logs de moderação
CREATE TABLE public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id),
  message_id UUID REFERENCES public.chat_messages(id),
  target_user_id UUID REFERENCES public.profiles(id),
  moderator_id UUID REFERENCES public.profiles(id) NOT NULL,
  action moderation_action NOT NULL,
  reason TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_conversations_unit_id ON public.conversations(unit_id);
CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_message_reads_message_id ON public.message_reads(message_id);
CREATE INDEX idx_message_reads_user_id ON public.message_reads(user_id);
CREATE INDEX idx_user_presence_user_id ON public.user_presence(user_id);

-- Criar bucket para anexos do chat
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket de anexos
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Users can view chat attachments"
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can delete chat attachments"
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'chat-attachments');

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário pode acessar conversa
CREATE OR REPLACE FUNCTION public.can_access_conversation(conv_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    JOIN public.conversations c ON c.id = cp.conversation_id
    JOIN public.profiles p ON p.id = user_id
    WHERE cp.conversation_id = conv_id
    AND cp.user_id = user_id
    AND cp.left_at IS NULL
    AND c.is_active = true
    AND (
      -- Mesma unidade ou admin
      c.unit_id = p.unit_id OR p.role = 'admin'
    )
  );
$$;

-- Políticas RLS para conversations
CREATE POLICY "Users can view accessible conversations"
ON public.conversations FOR SELECT 
TO authenticated 
USING (public.can_access_conversation(id, auth.uid()));

CREATE POLICY "Users can create conversations in their unit"
ON public.conversations FOR INSERT 
TO authenticated 
WITH CHECK (
  created_by = auth.uid() AND
  (unit_id = (SELECT unit_id FROM public.profiles WHERE id = auth.uid()) OR
   (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
);

CREATE POLICY "Conversation creators and admins can update"
ON public.conversations FOR UPDATE 
TO authenticated 
USING (
  created_by = auth.uid() OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Políticas RLS para conversation_participants
CREATE POLICY "Users can view participants of accessible conversations"
ON public.conversation_participants FOR SELECT 
TO authenticated 
USING (public.can_access_conversation(conversation_id, auth.uid()));

CREATE POLICY "Users can join conversations"
ON public.conversation_participants FOR INSERT 
TO authenticated 
WITH CHECK (
  user_id = auth.uid() AND
  public.can_access_conversation(conversation_id, auth.uid())
);

CREATE POLICY "Users can leave conversations"
ON public.conversation_participants FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Políticas RLS para chat_messages
CREATE POLICY "Users can view messages in accessible conversations"
ON public.chat_messages FOR SELECT 
TO authenticated 
USING (public.can_access_conversation(conversation_id, auth.uid()));

CREATE POLICY "Users can send messages to accessible conversations"
ON public.chat_messages FOR INSERT 
TO authenticated 
WITH CHECK (
  sender_id = auth.uid() AND
  public.can_access_conversation(conversation_id, auth.uid())
);

CREATE POLICY "Users can update their own messages or moderators can update any"
ON public.chat_messages FOR UPDATE 
TO authenticated 
USING (
  sender_id = auth.uid() OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'technician')
);

-- Políticas RLS para message_attachments
CREATE POLICY "Users can view attachments in accessible conversations"
ON public.message_attachments FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_messages cm 
    WHERE cm.id = message_id 
    AND public.can_access_conversation(cm.conversation_id, auth.uid())
  )
);

CREATE POLICY "Users can create attachments for their messages"
ON public.message_attachments FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_messages cm 
    WHERE cm.id = message_id 
    AND cm.sender_id = auth.uid()
  )
);

-- Políticas RLS para message_reads
CREATE POLICY "Users can view read status of accessible messages"
ON public.message_reads FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_messages cm 
    WHERE cm.id = message_id 
    AND public.can_access_conversation(cm.conversation_id, auth.uid())
  )
);

CREATE POLICY "Users can mark messages as read"
ON public.message_reads FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Políticas RLS para user_presence
CREATE POLICY "Users can view presence of users in same unit"
ON public.user_presence FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.id = auth.uid() AND p2.id = user_id
    AND (p1.unit_id = p2.unit_id OR p1.role = 'admin')
  )
);

CREATE POLICY "Users can update their own presence"
ON public.user_presence FOR ALL 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Políticas RLS para moderation_logs
CREATE POLICY "Moderators can view moderation logs"
ON public.moderation_logs FOR SELECT 
TO authenticated 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'technician')
);

CREATE POLICY "Moderators can create moderation logs"
ON public.moderation_logs FOR INSERT 
TO authenticated 
WITH CHECK (
  moderator_id = auth.uid() AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'technician')
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON public.conversations 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at 
  BEFORE UPDATE ON public.chat_messages 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at 
  BEFORE UPDATE ON public.user_presence 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para as tabelas principais
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.message_reads REPLICA IDENTITY FULL;
ALTER TABLE public.user_presence REPLICA IDENTITY FULL;

-- Adicionar tabelas ao realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
