
-- Adicionar campos para Evolution API nas configurações do sistema
ALTER TABLE system_settings 
ADD COLUMN evolution_api_url TEXT,
ADD COLUMN evolution_api_token TEXT,
ADD COLUMN evolution_instance_name TEXT,
ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT false;

-- Criar tabela para logs de notificações WhatsApp
CREATE TABLE whatsapp_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  evolution_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar campo de telefone nos perfis se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;
END $$;

-- RLS para whatsapp_notifications
ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own WhatsApp notifications" 
  ON whatsapp_notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WhatsApp notifications" 
  ON whatsapp_notifications FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all WhatsApp notifications" 
  ON whatsapp_notifications FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_notifications_updated_at
  BEFORE UPDATE ON whatsapp_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_notifications_updated_at();
