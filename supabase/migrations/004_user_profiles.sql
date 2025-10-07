-- User profiles table for extended user data
-- Automatically created when a user signs up

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{
        "theme": "dark",
        "notifications": true,
        "defaultLanguage": "typescript"
    }',
    api_keys JSONB DEFAULT '{}',
    usage_stats JSONB DEFAULT '{
        "totalGenerations": 0,
        "totalReviews": 0,
        "totalEnhancements": 0,
        "tokensUsed": 0
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Trigger to create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users table
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Function to update usage stats
CREATE OR REPLACE FUNCTION increment_usage_stat(
    user_id UUID,
    stat_name TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS void AS $$
BEGIN
    UPDATE user_profiles
    SET usage_stats = jsonb_set(
        usage_stats,
        ARRAY[stat_name],
        to_jsonb(COALESCE((usage_stats->stat_name)::integer, 0) + increment_by)
    )
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
