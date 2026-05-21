-- Migration 001: Add project_type to projects table
-- Run in Supabase Dashboard → SQL Editor
-- Safe: existing rows default to 'Residential'

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_type TEXT NOT NULL DEFAULT 'Residential'
    CHECK (project_type IN ('Residential', 'Commercial'));

COMMENT ON COLUMN projects.project_type IS 'Project type: Residential or Commercial';
