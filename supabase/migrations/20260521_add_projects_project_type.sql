-- Run manually in Supabase SQL Editor (Dashboard → SQL → New query).
-- Table: public.projects
-- Adds residential | commercial classification; existing rows default to residential.

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_type text NOT NULL DEFAULT 'residential';

ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_project_type_check;

ALTER TABLE public.projects
ADD CONSTRAINT projects_project_type_check
CHECK (project_type IN ('residential', 'commercial'));

COMMENT ON COLUMN public.projects.project_type IS
  'Portfolio segment: residential or commercial. Defaults to residential for legacy rows.';
