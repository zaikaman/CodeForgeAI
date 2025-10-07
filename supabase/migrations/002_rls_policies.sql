-- Row Level Security Policies for CodeForge AI
-- These policies ensure users can only access their own data

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhancement_proposals ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- Generation history policies
CREATE POLICY "Users can view their own generation history"
    ON generation_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generation history"
    ON generation_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generation history"
    ON generation_history FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generation history"
    ON generation_history FOR DELETE
    USING (auth.uid() = user_id);

-- Embeddings policies (tied to projects)
CREATE POLICY "Users can view embeddings for their projects"
    ON embeddings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = embeddings.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create embeddings for their projects"
    ON embeddings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = embeddings.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update embeddings for their projects"
    ON embeddings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = embeddings.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete embeddings for their projects"
    ON embeddings FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = embeddings.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Code outputs policies (tied to generation history)
CREATE POLICY "Users can view their own code outputs"
    ON code_outputs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM generation_history
            WHERE generation_history.id = code_outputs.history_id
            AND generation_history.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own code outputs"
    ON code_outputs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM generation_history
            WHERE generation_history.id = code_outputs.history_id
            AND generation_history.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own code outputs"
    ON code_outputs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM generation_history
            WHERE generation_history.id = code_outputs.history_id
            AND generation_history.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own code outputs"
    ON code_outputs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM generation_history
            WHERE generation_history.id = code_outputs.history_id
            AND generation_history.user_id = auth.uid()
        )
    );

-- Review reports policies (tied to projects)
CREATE POLICY "Users can view review reports for their projects"
    ON review_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = review_reports.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create review reports for their projects"
    ON review_reports FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = review_reports.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update review reports for their projects"
    ON review_reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = review_reports.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete review reports for their projects"
    ON review_reports FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = review_reports.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Enhancement proposals policies (tied to projects)
CREATE POLICY "Users can view enhancement proposals for their projects"
    ON enhancement_proposals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = enhancement_proposals.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create enhancement proposals for their projects"
    ON enhancement_proposals FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = enhancement_proposals.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update enhancement proposals for their projects"
    ON enhancement_proposals FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = enhancement_proposals.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete enhancement proposals for their projects"
    ON enhancement_proposals FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = enhancement_proposals.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Agents table has no RLS (managed by backend service role)
-- All users can read agents, but only service role can modify
CREATE POLICY "Anyone can read agents"
    ON agents FOR SELECT
    TO authenticated
    USING (true);
