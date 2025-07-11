-- Agregar campo para indicar si el autoresponder debe aplicarse automáticamente a todas las publicaciones
ALTER TABLE public.general_comment_autoresponders 
ADD COLUMN auto_assign_to_all_posts BOOLEAN DEFAULT false;

-- Comentario: Este campo indica si el autoresponder debe aplicarse automáticamente 
-- a todas las publicaciones nuevas que se detecten