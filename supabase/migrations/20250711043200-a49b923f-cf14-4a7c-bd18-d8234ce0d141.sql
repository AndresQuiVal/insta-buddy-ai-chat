-- Agregar foreign key constraint con CASCADE para eliminar asignaciones automáticamente
-- cuando se elimina un autoresponder general

-- Primero verificar si ya existe la constraint
DO $$ 
BEGIN
    -- Agregar la foreign key constraint con ON DELETE CASCADE
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'post_autoresponder_assignments_general_autoresponder_id_fkey'
        AND table_name = 'post_autoresponder_assignments'
    ) THEN
        ALTER TABLE public.post_autoresponder_assignments 
        ADD CONSTRAINT post_autoresponder_assignments_general_autoresponder_id_fkey 
        FOREIGN KEY (general_autoresponder_id) 
        REFERENCES public.general_comment_autoresponders(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint agregada exitosamente';
    ELSE
        RAISE NOTICE 'Foreign key constraint ya existe';
    END IF;
END $$;