ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS adjust_json JSONB;
