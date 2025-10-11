-- Fix orphan generations that exist in chat_messages but not in generations table
-- This handles generations created from frontend-only (local storage) that never synced to DB

-- First, check if there are any orphan chat messages
DO $$
BEGIN
    -- Create missing generation records for orphaned chat messages
    INSERT INTO public.generations (id, user_id, prompt, target_language, complexity, status, files, created_at)
    SELECT DISTINCT
        cm.generation_id,
        NULL::uuid as user_id, -- Cast NULL to uuid type
        'Chat session (recovered)' as prompt,
        'typescript' as target_language,
        'moderate' as complexity,
        'completed' as status,
        '[]'::jsonb as files,
        MIN(cm.created_at) as created_at
    FROM public.chat_messages cm
    LEFT JOIN public.generations g ON g.id = cm.generation_id
    WHERE g.id IS NULL
    GROUP BY cm.generation_id
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Orphan generations recovery completed';
END $$;

-- Add comment to table
COMMENT ON TABLE public.generations IS 'Stores code generation sessions. Can be created automatically when chat messages reference non-existent generation IDs.';
