-- Remove typescript default from target_language in generations table
-- This allows workflow to auto-detect language (vanilla HTML vs TypeScript)
ALTER TABLE public.generations 
  ALTER COLUMN target_language DROP DEFAULT;

-- Update existing rows with typescript to NULL so they can be auto-detected
-- (Optional: uncomment if you want to reset existing generations)
-- UPDATE public.generations SET target_language = NULL WHERE target_language = 'typescript';

COMMENT ON COLUMN public.generations.target_language IS 'Target programming language/framework. If not provided, workflow will auto-detect based on prompt complexity (vanilla HTML for simple requests, TypeScript for complex ones)';
