-- Migration: Add 'body' column to email_logs table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

ALTER TABLE email_logs
  ADD COLUMN IF NOT EXISTS body text;

-- Also add 'manual' to allowed types (used by /api/office/send-email)
-- (only needed if you have a CHECK constraint on the 'type' column)
-- ALTER TABLE email_logs DROP CONSTRAINT IF EXISTS email_logs_type_check;
