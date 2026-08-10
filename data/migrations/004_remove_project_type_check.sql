-- Migration 004: Remove hard-coded check constraint on project_type
-- Allows any string value so admins can create custom categories
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_project_type_check;

-- Also widen the column to plain TEXT with no default restriction
ALTER TABLE projects
  ALTER COLUMN project_type SET DEFAULT 'Residential';

COMMENT ON COLUMN projects.project_type IS 'Project category — free-form text, managed by admin';
