-- Rename system collection «Новинки» → «найновіше»
UPDATE categories
SET
  label_uk = 'найновіше',
  label_en = 'newest',
  updated_at = NOW()
WHERE id = 'new';
