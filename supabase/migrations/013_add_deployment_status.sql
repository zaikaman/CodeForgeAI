-- Add deployment status tracking columns to generations table
ALTER TABLE generations 
ADD COLUMN IF NOT EXISTS deployment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS deployment_error TEXT,
ADD COLUMN IF NOT EXISTS deployment_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deployment_completed_at TIMESTAMPTZ;

-- Create index for faster deployment status queries
CREATE INDEX IF NOT EXISTS idx_generations_deployment_status 
ON generations(deployment_status);

-- Add comment for documentation
COMMENT ON COLUMN generations.deployment_status IS 'Deployment status: pending, deploying, deployed, failed';
COMMENT ON COLUMN generations.deployment_error IS 'Error message if deployment failed';
COMMENT ON COLUMN generations.deployment_started_at IS 'Timestamp when deployment started';
COMMENT ON COLUMN generations.deployment_completed_at IS 'Timestamp when deployment completed or failed';
