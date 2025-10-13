-- Make language column optional and remove typescript default
-- This allows workflow to auto-detect language (vanilla HTML vs TypeScript)
ALTER TABLE public.chat_jobs 
  ALTER COLUMN language DROP DEFAULT,
  ALTER COLUMN language DROP NOT NULL;

-- Update existing rows with typescript to NULL so they can be auto-detected
-- (Optional: uncomment if you want to reset existing jobs)
-- UPDATE public.chat_jobs SET language = NULL WHERE language = 'typescript';

COMMENT ON COLUMN public.chat_jobs.language IS 'Optional target language. If not provided, workflow will auto-detect (vanilla HTML for simple requests, TypeScript for complex ones)';
