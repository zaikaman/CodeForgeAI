-- Vector Similarity Search Function
-- Provides semantic search using cosine similarity with pgvector

-- Function to match embeddings by similarity
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(384),
  query_project_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  chunk_index int,
  file_path text,
  content text,
  embedding vector(384),
  metadata jsonb,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.project_id,
    e.chunk_index,
    e.file_path,
    e.content,
    e.embedding,
    e.metadata,
    e.created_at,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM embeddings e
  WHERE e.project_id = query_project_id
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION match_embeddings TO authenticated;

-- Comment on function
COMMENT ON FUNCTION match_embeddings IS 'Performs semantic similarity search on embeddings using cosine distance. Returns embeddings ordered by similarity score (1 - cosine distance).';
