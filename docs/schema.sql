-- Bank Transactions Schema
-- Run this in the Supabase SQL editor to set up the database.

-- ------------------------------------------------------------
-- accounts
-- One row per bank account. Currency is the native currency
-- of the account (CRC, USD, etc).
-- ------------------------------------------------------------
create table accounts (
    id             uuid primary key default gen_random_uuid(),
    name           text not null,
    bank_name      text not null,
    currency       char(3) not null,
    account_number text unique,  -- full identifier, e.g. CR04010200009331755567
    short_number   text,         -- bank-specific short form used in transfer descriptions
    created_at     timestamptz default now()
);

-- ------------------------------------------------------------
-- categories
-- Expense/income categories managed from the Lovable UI.
-- ------------------------------------------------------------
create table categories (
    id          uuid primary key default gen_random_uuid(),
    name        text not null unique,
    color       text not null default '#6366f1',
    created_at  timestamptz default now()
);

-- ------------------------------------------------------------
-- transfers
-- Links two transactions that represent the same money moving
-- between accounts (even across currencies).
--
-- exchange_rate: units of to_tx currency per unit of from_tx
--   currency. e.g. if from_tx is USD and to_tx is CRC,
--   exchange_rate = 520.00 means 1 USD = 520 CRC.
--
-- exchange_source:
--   'calculated' — derived automatically from the two amounts
--   'manual'     — entered by the user in the UI
--   'bccr'       — official Banco Central de Costa Rica rate
--                  for that date (future: fetched via API)
-- ------------------------------------------------------------
create table transfers (
    id                uuid primary key default gen_random_uuid(),
    from_tx_id        uuid not null references transactions(id),
    to_tx_id          uuid not null references transactions(id),
    exchange_rate     numeric(16, 6),
    exchange_source   text check (exchange_source in ('calculated', 'manual', 'bccr')),
    created_at        timestamptz default now()
);

-- ------------------------------------------------------------
-- transactions
-- One row per transaction parsed from a bank statement PDF.
--
-- reference:   bank-assigned reference number (e.g. 406498222).
--              Used for deduplication and transfer matching.
-- code:        transaction type code from the bank (TF, CP, TS,
--              MD, PT, etc).
-- amount:      negative = debit (money out), positive = credit
--              (money in).
-- transfer_id: set when this transaction is one side of a
--              transfer. NULL for regular expenses/income.
--              Use WHERE transfer_id IS NULL to exclude
--              transfers from expense graphs.
-- status:      'pending'   — imported, not yet reviewed
--              'confirmed' — reviewed and approved by user
-- ------------------------------------------------------------
create table transactions (
    id          uuid primary key default gen_random_uuid(),
    account_id  uuid not null references accounts(id),
    date        date not null,
    reference   text,
    code        text,
    description text not null,
    amount      numeric(12, 2) not null,
    balance     numeric(12, 2),
    currency    char(3) not null,
    category_id uuid references categories(id),
    transfer_id uuid references transfers(id),
    source_file text,
    status      text not null default 'pending'
                    check (status in ('pending', 'confirmed')),
    notes       text,
    created_at  timestamptz default now(),

    -- reference is more reliable than description for dedup;
    -- a NULL reference falls back to allowing duplicates
    -- (handled in application logic)
    unique (account_id, date, reference, amount)
);

-- ------------------------------------------------------------
-- Useful queries
-- ------------------------------------------------------------

-- All expenses (excluding transfers) for a given account:
-- SELECT * FROM transactions
-- WHERE account_id = '<uuid>'
--   AND transfer_id IS NULL
--   AND amount < 0
-- ORDER BY date DESC;

-- Monthly spending by category:
-- SELECT c.name, SUM(ABS(t.amount)) as total
-- FROM transactions t
-- LEFT JOIN categories c ON c.id = t.category_id
-- WHERE t.transfer_id IS NULL AND t.amount < 0
-- GROUP BY c.name
-- ORDER BY total DESC;

-- Pending transactions to review:
-- SELECT * FROM transactions WHERE status = 'pending' ORDER BY date DESC;
