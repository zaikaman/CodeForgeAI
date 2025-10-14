-- Migration: Add atomic job claiming function for distributed processing
-- Prevents race conditions when multiple Heroku dynos process jobs

-- Create function to atomically claim a pending job
CREATE OR REPLACE FUNCTION claim_pending_job()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  session_id uuid,
  type text,
  status text,
  user_message text,
  context jsonb,
  progress integer,
  result jsonb,
  error text,
  logs text[],
  created_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz
)
LANGUAGE plpgsql
AS $$
DECLARE
  claimed_job_id uuid;
BEGIN
  -- Select oldest pending job and lock it
  -- FOR UPDATE SKIP LOCKED ensures only ONE dyno gets the job
  -- Other dynos will skip locked rows and return nothing
  SELECT background_jobs.id INTO claimed_job_id
  FROM background_jobs
  WHERE background_jobs.status = 'pending'
  ORDER BY background_jobs.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  -- If no job found, return empty
  IF claimed_job_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Mark job as processing
  UPDATE background_jobs
  SET 
    status = 'processing',
    started_at = NOW()
  WHERE background_jobs.id = claimed_job_id;
  
  -- Return the claimed job
  RETURN QUERY
  SELECT 
    background_jobs.id,
    background_jobs.user_id,
    background_jobs.session_id,
    background_jobs.type,
    background_jobs.status,
    background_jobs.user_message,
    background_jobs.context,
    background_jobs.progress,
    background_jobs.result,
    background_jobs.error,
    background_jobs.logs,
    background_jobs.created_at,
    background_jobs.started_at,
    background_jobs.completed_at
  FROM background_jobs
  WHERE background_jobs.id = claimed_job_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION claim_pending_job() TO authenticated;
GRANT EXECUTE ON FUNCTION claim_pending_job() TO anon;
GRANT EXECUTE ON FUNCTION claim_pending_job() TO service_role;

-- Add comment
COMMENT ON FUNCTION claim_pending_job() IS 
'Atomically claims the oldest pending background job for processing. Uses FOR UPDATE SKIP LOCKED to prevent race conditions in distributed environments with multiple workers.';
