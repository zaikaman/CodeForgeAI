-- Create chat_jobs table to track chat request processing
CREATE TABLE IF NOT EXISTS public.chat_jobs (
  id TEXT PRIMARY KEY,
  generation_id TEXT NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  current_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  language TEXT NOT NULL DEFAULT 'typescript',
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  result JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_chat_jobs_generation_id ON public.chat_jobs(generation_id);
CREATE INDEX IF NOT EXISTS idx_chat_jobs_user_id ON public.chat_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_jobs_status ON public.chat_jobs(status);
CREATE INDEX IF NOT EXISTS idx_chat_jobs_created_at ON public.chat_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE public.chat_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own chat jobs
CREATE POLICY "Users can view their own chat jobs"
  ON public.chat_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat jobs"
  ON public.chat_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat jobs"
  ON public.chat_jobs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_chat_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_jobs_updated_at
  BEFORE UPDATE ON public.chat_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_jobs_updated_at();
