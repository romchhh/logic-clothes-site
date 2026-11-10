-- Main fabric / lining / insulation fields for PDP fabric grid.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS fabric_name text,
  ADD COLUMN IF NOT EXISTS lining text,
  ADD COLUMN IF NOT EXISTS lining_composition text,
  ADD COLUMN IF NOT EXISTS insulation text;
