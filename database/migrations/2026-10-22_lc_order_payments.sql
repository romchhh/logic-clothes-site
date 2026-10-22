-- WayForPay / checkout payment fields
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'pay_after',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS amount_to_pay numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_type_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_payment_type_check
  CHECK (payment_type = ANY (ARRAY['full'::text, 'prepay'::text, 'pay_after'::text]));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text]));

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders (payment_status);
