
-- Primeiro, remover todas as políticas RLS que dependem das funções
DROP POLICY IF EXISTS "Chat rooms - access policy" ON public.chat_rooms;
DROP POLICY IF EXISTS "Chat participants - access policy" ON public.chat_participants;
DROP POLICY IF EXISTS "Chat participants - create policy" ON public.chat_participants;
DROP POLICY IF EXISTS "Chat messages - access policy" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat messages - create policy" ON public.chat_messages;

-- Remover outras políticas que possam existir
DROP POLICY IF EXISTS "Users can view accessible chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Room creators and admins can update rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view participants of accessible rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can manage participants in their rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view participants of their rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can leave rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view messages in accessible rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to accessible rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their messages or admins can update any" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can soft delete their messages" ON public.chat_messages;

-- Remover triggers relacionados ao chat
DROP TRIGGER IF EXISTS auto_add_unit_participants_trigger ON public.chat_rooms;
DROP TRIGGER IF EXISTS auto_add_chat_participants_trigger ON public.chat_rooms;

-- Agora remover as tabelas com CASCADE para forçar a remoção
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_participants CASCADE;
DROP TABLE IF EXISTS public.chat_rooms CASCADE;

-- Agora remover as funções com CASCADE
DROP FUNCTION IF EXISTS public.get_user_chat_rooms(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_can_access_chat_room(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_access_chat_room_v2(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_available_chat_users(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_available_chat_users_final(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_available_chat_users_safe() CASCADE;
DROP FUNCTION IF EXISTS public.get_chat_available_users() CASCADE;
DROP FUNCTION IF EXISTS public.can_delete_chat_room(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_user_access_room(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_can_access_chat_room(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.auto_add_unit_participants() CASCADE;
DROP FUNCTION IF EXISTS public.auto_add_chat_participants() CASCADE;
DROP FUNCTION IF EXISTS public.find_existing_private_chat(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_info() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_safe() CASCADE;
DROP FUNCTION IF EXISTS public.is_participant(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_room(uuid) CASCADE;

-- Remover enum de chat_type se existir
DROP TYPE IF EXISTS public.chat_type CASCADE;

-- Remover bucket de storage do chat
DELETE FROM storage.objects WHERE bucket_id = 'chat-attachments';
DELETE FROM storage.buckets WHERE id = 'chat-attachments';

-- Remover políticas de storage do chat
DROP POLICY IF EXISTS "Authenticated users can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat attachments they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete chat attachments" ON storage.objects;

-- Adicionar políticas RLS para permitir votação em enquetes
CREATE POLICY "Users can update poll votes on posts"
ON public.landing_page_posts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Adicionar políticas RLS para comentários nos posts
CREATE POLICY "Users can view all post comments"
ON public.post_comments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create post comments"
ON public.post_comments
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments"
ON public.post_comments
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
ON public.post_comments
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Adicionar políticas RLS para likes nos posts
CREATE POLICY "Users can view all post likes"
ON public.post_likes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create post likes"
ON public.post_likes
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own likes"
ON public.post_likes
FOR DELETE
To authenticated
USING (user_id = auth.uid());
