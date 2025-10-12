-- Add progress_messages column to chat_jobs for realtime agent updates
-- This allows streaming progress updates to the frontend

ALTER TABLE public.chat_jobs
ADD COLUMN IF NOT EXISTS progress_messages JSONB DEFAULT '[]'::jsonb;

-- Add index for efficient progress message queries
CREATE INDEX IF NOT EXISTS idx_chat_jobs_progress_messages ON public.chat_jobs USING GIN (progress_messages);

-- Add comment
COMMENT ON COLUMN public.chat_jobs.progress_messages IS 'Array of progress messages showing agent workflow steps in real-time. Format: [{"timestamp": "ISO8601", "agent": "AgentName", "status": "started|completed|error", "message": "Description"}]';
