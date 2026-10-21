-- Structured variant fields for order lines (size stays as the cart key / primary size).
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS length_opt TEXT,
  ADD COLUMN IF NOT EXISTS material_opt TEXT,
  ADD COLUMN IF NOT EXISTS size_label TEXT;
