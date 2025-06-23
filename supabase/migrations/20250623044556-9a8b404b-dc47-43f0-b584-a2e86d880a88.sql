
-- Adicionar foreign key constraints para relacionar as tabelas corretamente
ALTER TABLE public.post_comments 
ADD CONSTRAINT fk_post_comments_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.post_comments 
ADD CONSTRAINT fk_post_comments_post_id 
FOREIGN KEY (post_id) REFERENCES public.landing_page_posts(id) ON DELETE CASCADE;

ALTER TABLE public.post_likes 
ADD CONSTRAINT fk_post_likes_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.post_likes 
ADD CONSTRAINT fk_post_likes_post_id 
FOREIGN KEY (post_id) REFERENCES public.landing_page_posts(id) ON DELETE CASCADE;
