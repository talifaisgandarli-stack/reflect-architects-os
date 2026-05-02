-- C1: Defense-in-depth — DB trigger ensures income row when invoice marked paid
-- Complements client-side logic in HesabFakturalarPage.markPaid (A1)
-- Idempotent via incomes.invoice_id unique check

CREATE OR REPLACE FUNCTION fn_invoice_paid_to_income()
RETURNS TRIGGER AS $$
BEGIN
  -- only fire when status transitions to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
    -- skip if income already exists for this invoice
    IF NOT EXISTS (SELECT 1 FROM incomes WHERE invoice_id = NEW.id) THEN
      INSERT INTO incomes (
        invoice_id,
        client_id,
        project_id,
        amount,
        date,
        note
      ) VALUES (
        NEW.id,
        NEW.client_id,
        NEW.project_id,
        NEW.amount,
        COALESCE(NEW.paid_at::date, CURRENT_DATE),
        'Auto: faktura ' || COALESCE(NEW.invoice_number, NEW.name, NEW.id::text)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_paid_to_income ON invoices;

CREATE TRIGGER trg_invoice_paid_to_income
AFTER INSERT OR UPDATE OF status ON invoices
FOR EACH ROW
EXECUTE FUNCTION fn_invoice_paid_to_income();
