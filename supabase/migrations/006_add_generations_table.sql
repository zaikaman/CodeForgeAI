CREATE TABLE generations (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  files JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);
