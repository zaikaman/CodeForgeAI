-- CodeForge AI Initial Database Schema
-- This migration creates the core tables for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    root_path TEXT NOT NULL,
    file_count INTEGER DEFAULT 0,
    total_lines INTEGER DEFAULT 0,
    total_bytes BIGINT DEFAULT 0,
    embedding_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    tools JSONB DEFAULT '[]',
    capabilities JSONB DEFAULT '[]',
    config JSONB NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generation history table
CREATE TABLE generation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    request_id UUID NOT NULL,
    output_id UUID,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    prompt TEXT NOT NULL,
    target_file TEXT,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    metrics JSONB DEFAULT '{}',
    feedback JSONB,
    error TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Embeddings table (stores vector embeddings for RAG)
CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(384), -- all-MiniLM-L6-v2 dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, file_path, chunk_index)
);

-- Enable vector extension for embeddings (requires pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- Code outputs table
CREATE TABLE code_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL,
    history_id UUID REFERENCES generation_history(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    code JSONB NOT NULL,
    tests JSONB DEFAULT '[]',
    validation JSONB NOT NULL,
    confidence JSONB NOT NULL,
    explanation TEXT,
    alternatives JSONB DEFAULT '[]',
    tokens_used INTEGER,
    generation_time REAL,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review reports table
CREATE TABLE review_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    target_file TEXT,
    findings JSONB NOT NULL DEFAULT '[]',
    metrics JSONB NOT NULL,
    summary JSONB NOT NULL,
    agent_ids UUID[] DEFAULT '{}',
    review_time REAL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhancement proposals table
CREATE TABLE enhancement_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    proposals JSONB NOT NULL DEFAULT '[]',
    overall_impact JSONB NOT NULL,
    estimated_time TEXT,
    priority INTEGER DEFAULT 3,
    status TEXT DEFAULT 'draft',
    agent_ids UUID[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    applied_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better query performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_generation_history_user_id ON generation_history(user_id);
CREATE INDEX idx_generation_history_project_id ON generation_history(project_id);
CREATE INDEX idx_generation_history_status ON generation_history(status);
CREATE INDEX idx_embeddings_project_id ON embeddings(project_id);
CREATE INDEX idx_embeddings_file_path ON embeddings(project_id, file_path);
CREATE INDEX idx_code_outputs_request_id ON code_outputs(request_id);
CREATE INDEX idx_review_reports_project_id ON review_reports(project_id);
CREATE INDEX idx_enhancement_proposals_project_id ON enhancement_proposals(project_id);
CREATE INDEX idx_enhancement_proposals_status ON enhancement_proposals(status);

-- Add vector similarity search index
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_generation_history_updated_at
    BEFORE UPDATE ON generation_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_code_outputs_updated_at
    BEFORE UPDATE ON code_outputs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_review_reports_updated_at
    BEFORE UPDATE ON review_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_enhancement_proposals_updated_at
    BEFORE UPDATE ON enhancement_proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
