-- D5: Invoice template fields (line items, VÖEN, advance, contract name)
-- Run this in Supabase SQL editor.

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS line_items     JSONB DEFAULT '[]'::jsonb;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_voen    TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS contract_name  TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS advance_paid   NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_rate       INTEGER DEFAULT 18;

-- Backfill: copy existing name into invoice_number if empty
UPDATE invoices SET invoice_number = name WHERE invoice_number IS NULL;
