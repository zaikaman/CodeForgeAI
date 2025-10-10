-- Create chat_messages table for storing conversation history
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_id TEXT NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    image_urls TEXT[] DEFAULT '{}',
    token_count INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by generation_id
CREATE INDEX IF NOT EXISTS idx_chat_messages_generation_id ON public.chat_messages(generation_id);

-- Create index for ordering messages by creation time
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(generation_id, created_at);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own chat messages"
    ON public.chat_messages
    FOR SELECT
    USING (
        generation_id IN (
            SELECT id FROM public.generations
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own chat messages"
    ON public.chat_messages
    FOR INSERT
    WITH CHECK (
        generation_id IN (
            SELECT id FROM public.generations
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own chat messages"
    ON public.chat_messages
    FOR UPDATE
    USING (
        generation_id IN (
            SELECT id FROM public.generations
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own chat messages"
    ON public.chat_messages
    FOR DELETE
    USING (
        generation_id IN (
            SELECT id FROM public.generations
            WHERE user_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_chat_messages_updated_at_trigger
    BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_messages_updated_at();
