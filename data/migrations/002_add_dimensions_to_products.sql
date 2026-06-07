-- Migration 002: Add dimensions to products table
-- Run in Supabase Dashboard → SQL Editor
-- Safe: existing rows default to NULL (optional field)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS dimensions TEXT DEFAULT NULL;

COMMENT ON COLUMN products.dimensions IS 'Optional product dimensions, e.g. "W120 x D80 x H75 cm"';
