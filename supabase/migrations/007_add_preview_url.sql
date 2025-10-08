-- Add preview_url column to generations table
ALTER TABLE generations
ADD COLUMN IF NOT EXISTS preview_url TEXT;