-- Migration: Add body column to email_logs table
-- Run this in Supabase SQL Editor

ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS body text;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'email_logs' 
ORDER BY ordinal_position;
