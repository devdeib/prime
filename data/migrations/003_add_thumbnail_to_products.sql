-- Migration 003: Add thumbnail_url to products table
-- Run in Supabase Dashboard → SQL Editor
-- Safe: existing rows default to NULL (optional field)
-- thumbnail_url is a separate, smaller image used only in product cards/grids.
-- If NULL, the card falls back to image_url (same as before).

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT DEFAULT NULL;

COMMENT ON COLUMN products.thumbnail_url IS 'Optional card thumbnail image URL. Falls back to image_url when NULL.';
