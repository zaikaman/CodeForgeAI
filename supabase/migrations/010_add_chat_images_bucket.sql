-- Storage bucket for chat and generation images
-- Used for storing images uploaded by users in chat and generation forms

-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for chat-images bucket
CREATE POLICY "Users can upload chat images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'chat-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view chat images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'chat-images');

CREATE POLICY "Users can update their own chat images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'chat-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own chat images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'chat-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Add image_urls column to generations table to store uploaded images
ALTER TABLE generations
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN generations.image_urls IS 'Array of Supabase storage URLs for images uploaded with generation request';
