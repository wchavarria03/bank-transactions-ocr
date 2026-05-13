# Plan: Supabase Integration

## Goal
Replace file-based output with Supabase as the storage layer, supporting multiple bank statement formats, a dry-run preview step, and a schema ready for the Lovable UI.

---

## Architecture

```
Bank PDFs
    ↓
Go CLI
  - selects parser by --bank flag
  - extracts text from PDF (existing)
  - parses transactions via BankParser interface
  - previews in terminal (--dry-run)
  - inserts into Supabase via REST API
    ↓
Supabase (PostgreSQL)
    ↓
Lovable UI (graphs, categories, edits)
```

---

## Schema (Supabase)

See `docs/schema.sql` for the full SQL. Summary:

- **accounts** — one row per bank account, with currency
- **categories** — expense categories managed from the UI
- **transfers** — links two transaction IDs for same-money movements across accounts;
  stores the exchange rate (calculated from amounts, manual, or BCCR official)
- **transactions** — one row per transaction; includes `reference` (bank ref number used
  for dedup and transfer matching), `code` (TF/CP/TS/MD etc), `transfer_id` (nullable,
  set when transaction is one side of a transfer)

Key design decisions:
- Dedup key is `(account_id, date, reference, amount)` — more reliable than description
- Transfer exchange rate is calculated automatically from the two amounts when currencies differ
- `transfer_id IS NULL` in WHERE clause excludes transfers from expense graphs
- BCCR rate can be stored alongside BAC's implied rate to track bank spread cost

---

## Phase 1 — Parser abstraction (do first, verify it works)

### Step 1 — Parser interface ✓
- `Transaction` struct: Date, Reference, Code, Description, Amount, Balance, Currency
- `BankParser` interface: `Name()`, `Detect()`, `Parse()`

### Step 2 — Registry ✓
### Step 3 — BAC total-account parser ✓ (captures Reference, Code, Description, currency auto-detected)
### Step 4 — Update `extract` command ✓
### Step 5 — Delete `internal/transactionsextractor/` ✓

---

## Phase 2 — Supabase integration (after Phase 1 is verified)

### Step 6 — Schema SQL file
- Create `docs/schema.sql`
- Create Supabase project and run the schema

### Step 7 — Config / env
- Create `internal/config/config.go`
- Read `SUPABASE_URL` and `SUPABASE_KEY` from env or `.env` file

### Step 8 — Supabase client
- Create `internal/supabase/client.go`
- HTTP client wrapping Supabase REST API
- `UpsertTransactions([]Transaction) error` — uses unique constraint for dedup

### Step 9 — Wire up `extract` command
- Add flags: `--account <uuid>`, `--dry-run`
- Flow: extract PDF text → auto-detect parser → parse → preview or insert into Supabase
- Remove file output

### Step 10 — Docs
- `README.md` — updated usage
- `docs/SUPABASE_SETUP.md` — steps to create project and run schema
- `FUTURE_ENHANCEMENTS.md` — update status

---

## New CLI usage

```bash
# Dry run — auto-detects format, previews without writing to DB
./bank-transactions-ocr -v -i ./pdfs --account <uuid> --dry-run extract

# Real run — auto-detects format, inserts into Supabase
./bank-transactions-ocr -v -i ./pdfs --account <uuid> extract

# Env vars required
export SUPABASE_URL=https://xxxx.supabase.co
export SUPABASE_KEY=your-service-role-key
```

## Adding a new bank format

Create one file, implement the interface, done — no other changes needed:

```
internal/parser/parsers/bancolombia/credit_card.go
internal/parser/parsers/bancolombia/savings.go
internal/parser/parsers/davivienda/credit_card.go
```

Each file registers itself via `init()` so the CLI picks it up automatically.

---

## What this enables in Lovable UI
- List/filter transactions by account, date, category
- Edit description, category, notes, status (pending → confirmed)
- Build graphs: spending by category, monthly totals, account balances
- Multi-currency accounts side by side
