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

```sql
create table accounts (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    bank_name   text not null,
    currency    char(3) not null default 'USD',
    created_at  timestamptz default now()
);

create table categories (
    id          uuid primary key default gen_random_uuid(),
    name        text not null unique,
    color       text not null default '#6366f1',
    created_at  timestamptz default now()
);

create table transactions (
    id          uuid primary key default gen_random_uuid(),
    account_id  uuid not null references accounts(id),
    date        date not null,
    description text not null,
    amount      numeric(12,2) not null,
    balance     numeric(12,2),
    currency    char(3) not null,
    category_id uuid references categories(id),
    source_file text,
    status      text not null default 'pending'
                    check (status in ('pending', 'confirmed')),
    notes       text,
    created_at  timestamptz default now(),
    unique(account_id, date, description, amount)
);
```

---

## Phase 1 — Parser abstraction (do first, verify it works)

### Step 1 — Parser interface
- Create `internal/parser/parser.go`:
  - `Transaction` struct (Date, Description, Amount, Balance, Currency)
  - `BankParser` interface with `Name()`, `Detect(text string) bool`, `Parse(text string) ([]Transaction, error)`

### Step 2 — Registry
- Create `internal/parser/registry.go`
- Global registry, parsers self-register via `init()`
- `Detect(text)` — tries all parsers, returns first match
- `List()` — returns all registered parser names (used in error messages)

### Step 3 — BAC parser
- Create `internal/parser/parsers/bac/statement.go`
- Move current logic from `transactionsextractor` here
- `Detect()` — identify BAC-specific markers in the text
- `Parse()` — existing 7-field logic

### Step 4 — Update `extract` command
- Replace `transactionsextractor` with new parser registry
- Keep writing output to `.transactions` files for now (DB comes in Phase 2)
- If no parser matches: print error listing supported formats

### Step 5 — Delete `internal/transactionsextractor/`

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
