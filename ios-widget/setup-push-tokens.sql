-- Tabela do przechowywania tokenów push APNs
-- Uruchom w Supabase SQL Editor (Database → SQL Editor)

CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'ios',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indeks na token dla szybkiego upsert
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);

-- RLS: tylko service role może zarządzać tokenami
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON push_tokens
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
