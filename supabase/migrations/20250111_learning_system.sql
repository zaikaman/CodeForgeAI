-- Learning System Tables for Supabase
-- Run this migration to create tables for the error learning system

-- 1. Error History Table
CREATE TABLE IF NOT EXISTS error_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  language TEXT NOT NULL,
  framework TEXT,
  platform TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  build_logs TEXT,
  files_involved TEXT[] NOT NULL DEFAULT '{}',
  user_prompt TEXT NOT NULL,
  fix_attempts INTEGER NOT NULL DEFAULT 0,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  applied_fix TEXT,
  resolution_time INTERVAL,
  user_id UUID REFERENCES auth.users(id),
  generation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Error Patterns Table
CREATE TABLE IF NOT EXISTS error_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  languages TEXT[] NOT NULL DEFAULT '{}',
  frameworks TEXT[] NOT NULL DEFAULT '{}',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  error_signatures TEXT[] NOT NULL DEFAULT '{}', -- Regex patterns
  common_causes TEXT[] NOT NULL DEFAULT '{}',
  prevention_rules TEXT[] NOT NULL DEFAULT '{}',
  fix_strategies TEXT[] NOT NULL DEFAULT '{}',
  occurrence_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  success_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  examples TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Language-Specific Rules Table
CREATE TABLE IF NOT EXISTS language_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT NOT NULL UNIQUE,
  rules TEXT[] NOT NULL DEFAULT '{}',
  rule_sources TEXT[] NOT NULL DEFAULT '{}', -- Which errors generated these rules
  confidence_score DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Framework-Specific Rules Table
CREATE TABLE IF NOT EXISTS framework_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL,
  rules TEXT[] NOT NULL DEFAULT '{}',
  rule_sources TEXT[] NOT NULL DEFAULT '{}',
  confidence_score DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Platform-Specific Rules Table
CREATE TABLE IF NOT EXISTS platform_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL UNIQUE,
  rules TEXT[] NOT NULL DEFAULT '{}',
  rule_sources TEXT[] NOT NULL DEFAULT '{}',
  confidence_score DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Global Best Practices Table
CREATE TABLE IF NOT EXISTS global_best_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice TEXT NOT NULL,
  category TEXT NOT NULL,
  applicable_languages TEXT[] NOT NULL DEFAULT '{}',
  applicable_frameworks TEXT[] NOT NULL DEFAULT '{}',
  success_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Knowledge Base Metadata Table
CREATE TABLE IF NOT EXISTS knowledge_base_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  total_errors_captured INTEGER NOT NULL DEFAULT 0,
  total_errors_resolved INTEGER NOT NULL DEFAULT 0,
  total_patterns INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_history_language ON error_history(language);
CREATE INDEX IF NOT EXISTS idx_error_history_platform ON error_history(platform);
CREATE INDEX IF NOT EXISTS idx_error_history_error_type ON error_history(error_type);
CREATE INDEX IF NOT EXISTS idx_error_history_resolved ON error_history(resolved);
CREATE INDEX IF NOT EXISTS idx_error_history_timestamp ON error_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_history_generation_id ON error_history(generation_id);

CREATE INDEX IF NOT EXISTS idx_error_patterns_category ON error_patterns(category);
CREATE INDEX IF NOT EXISTS idx_error_patterns_occurrence ON error_patterns(occurrence_count DESC);
CREATE INDEX IF NOT EXISTS idx_error_patterns_success_rate ON error_patterns(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_error_patterns_last_seen ON error_patterns(last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_language_rules_language ON language_rules(language);
CREATE INDEX IF NOT EXISTS idx_framework_rules_framework ON framework_rules(framework);
CREATE INDEX IF NOT EXISTS idx_platform_rules_platform ON platform_rules(platform);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_error_history_updated_at 
  BEFORE UPDATE ON error_history 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_error_patterns_updated_at 
  BEFORE UPDATE ON error_patterns 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_language_rules_updated_at 
  BEFORE UPDATE ON language_rules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_framework_rules_updated_at 
  BEFORE UPDATE ON framework_rules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_rules_updated_at 
  BEFORE UPDATE ON platform_rules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_best_practices_updated_at 
  BEFORE UPDATE ON global_best_practices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_metadata_updated_at 
  BEFORE UPDATE ON knowledge_base_metadata 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initialize metadata
INSERT INTO knowledge_base_metadata (version, total_errors_captured, total_errors_resolved, total_patterns)
VALUES ('1.0.0', 0, 0, 0)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE error_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_best_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_metadata ENABLE ROW LEVEL SECURITY;

-- Policies (allow read for authenticated users, write for service role)
CREATE POLICY "Allow authenticated users to read error history"
  ON error_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role to write error history"
  ON error_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read error patterns"
  ON error_patterns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role to manage error patterns"
  ON error_patterns FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read language rules"
  ON language_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role to manage language rules"
  ON language_rules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read framework rules"
  ON framework_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role to manage framework rules"
  ON framework_rules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read platform rules"
  ON platform_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role to manage platform rules"
  ON platform_rules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read best practices"
  ON global_best_practices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role to manage best practices"
  ON global_best_practices FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read metadata"
  ON knowledge_base_metadata FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role to manage metadata"
  ON knowledge_base_metadata FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE error_history IS 'Historical record of all deployment errors for learning';
COMMENT ON TABLE error_patterns IS 'Learned patterns from recurring errors';
COMMENT ON TABLE language_rules IS 'Language-specific rules learned from errors';
COMMENT ON TABLE framework_rules IS 'Framework-specific rules learned from errors';
COMMENT ON TABLE platform_rules IS 'Platform-specific deployment rules';
COMMENT ON TABLE global_best_practices IS 'Universal coding best practices';
COMMENT ON TABLE knowledge_base_metadata IS 'Metadata about the learning system';
