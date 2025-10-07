-- Storage buckets for CodeForge AI
-- Used for storing project files and related data

-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false);

-- Create storage bucket for embeddings cache
INSERT INTO storage.buckets (id, name, public)
VALUES ('embeddings', 'embeddings', false);

-- RLS policies for project-files bucket
CREATE POLICY "Users can upload project files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'project-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own project files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'project-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own project files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'project-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own project files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'project-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- RLS policies for embeddings bucket
CREATE POLICY "Users can upload embeddings"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'embeddings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own embeddings"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'embeddings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own embeddings"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'embeddings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own embeddings"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'embeddings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
