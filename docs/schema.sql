-- Bank Transactions Schema
-- Run this in the Supabase SQL editor to set up the database.

-- ------------------------------------------------------------
-- accounts
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
-- Hierarchical: set parent_id to group sub-categories under a parent.
-- e.g. "Food" (parent) > "Groceries", "Restaurants" (children)
-- Graphs roll up to parent; queries can use recursive CTEs.
-- ------------------------------------------------------------
create table categories (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    parent_id   uuid references categories(id),  -- null = top-level category
    color       text not null default '#6366f1',
    created_at  timestamptz default now(),
    unique (name, parent_id)
);

-- ------------------------------------------------------------
-- transactions
-- One row per transaction parsed from a bank statement PDF.
--
-- type:
--   'expense'      — money out for goods/services
--   'income'       — salary, deposits, freelance
--   'transfer_out' — money leaving to another account you own
--   'transfer_in'  — money arriving from another account you own
--   'fee'          — bank commissions, service charges
--   'interest'     — bank interest paid or received
--
-- reconciled: true once you have verified the transaction
--   matches your bank statement for that period. Reconciled
--   transactions should not be edited.
--
-- transfer_id: set when this transaction is one side of a
--   transfer. NULL for regular expenses/income.
--   Use WHERE transfer_id IS NULL to exclude transfers from
--   expense graphs.
--
-- status:
--   'pending'   — imported, not yet reviewed
--   'confirmed' — reviewed and approved by user in UI
-- ------------------------------------------------------------

-- Create transactions first without the transfer_id FK (circular reference
-- resolved below after transfers table is created).
create table transactions (
    id           uuid primary key default gen_random_uuid(),
    account_id   uuid not null references accounts(id),
    date         date not null,
    reference    text,
    code         text,
    description  text not null,
    type         text not null
                     check (type in ('expense','income','transfer_out','transfer_in','fee','interest')),
    amount       numeric(12,2) not null,  -- negative = debit, positive = credit
    balance      numeric(12,2),
    currency     char(3) not null,
    category_id  uuid references categories(id),
    transfer_id  uuid,                    -- FK added below after transfers table exists
    source_file  text,
    status       text not null default 'pending'
                     check (status in ('pending','confirmed')),
    reconciled   boolean not null default false,
    notes        text,
    created_at   timestamptz default now(),
    updated_at   timestamptz default now(),

    unique (account_id, date, reference, amount)
);

-- Auto-maintain updated_at on every row change.
create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_transactions_updated_at
before update on transactions
for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- transfers
-- Links two transactions that represent the same money moving
-- between accounts (even across currencies).
--
-- exchange_rate: units of to_tx currency per 1 unit of from_tx
--   currency. e.g. from USD to CRC: rate = 520.000000
--
-- exchange_source:
--   'calculated' — derived automatically from the two amounts
--   'manual'     — entered by the user in the UI
--   'bccr'       — official Banco Central de Costa Rica rate
--                  for that date (future: fetched via API)
-- ------------------------------------------------------------
create table transfers (
    id              uuid primary key default gen_random_uuid(),
    from_tx_id      uuid not null references transactions(id),
    to_tx_id        uuid not null references transactions(id),
    exchange_rate   numeric(16,6),
    exchange_source text check (exchange_source in ('calculated','manual','bccr')),
    created_at      timestamptz default now()
);

-- Now add the FK from transactions to transfers (circular reference resolved).
alter table transactions
    add constraint transactions_transfer_id_fkey
    foreign key (transfer_id) references transfers(id);

-- ------------------------------------------------------------
-- classification_rules
-- Bank-specific rules that auto-assign type and/or category
-- to imported transactions, overriding the parser's derived values.
--
-- Matching logic (all non-null fields must match):
--   bank_name           — e.g. 'bac'; null = applies to all banks
--   code                — exact match on transaction code (e.g. 'TF')
--   description_pattern — ILIKE pattern (e.g. '%WALMART%')
--
-- On conflict the rule with the highest priority wins.
-- If type_override is null, the parser-derived type is kept.
-- If category_id is null, no category is auto-assigned.
--
-- Applied by the import pipeline after parsing, before inserting
-- transactions. Rules can also be re-applied in bulk from the UI
-- (e.g. after adding a new rule to back-fill existing rows).
-- ------------------------------------------------------------
create table classification_rules (
    id                  uuid primary key default gen_random_uuid(),
    bank_name           text,
    code                text,
    description_pattern text,
    type_override       text check (type_override in
                            ('expense','income','transfer_out','transfer_in','fee','interest')),
    category_id         uuid references categories(id),
    priority            int not null default 0,
    created_at          timestamptz default now(),

    constraint classification_rules_has_condition
        check (bank_name is not null or code is not null or description_pattern is not null)
);

-- ------------------------------------------------------------
-- Useful queries
-- ------------------------------------------------------------

-- All expenses (excluding transfers) for a given account:
-- select * from transactions
-- where account_id = '<uuid>'
--   and type in ('expense', 'fee')
-- order by date desc;

-- Monthly spending by category:
-- select c.name, sum(abs(t.amount)) as total
-- from transactions t
-- left join categories c on c.id = t.category_id
-- where t.type in ('expense', 'fee')
-- group by c.name
-- order by total desc;

-- Spending by parent category (rolls up sub-categories):
-- select coalesce(parent.name, c.name) as category, sum(abs(t.amount)) as total
-- from transactions t
-- left join categories c on c.id = t.category_id
-- left join categories parent on parent.id = c.parent_id
-- where t.type in ('expense', 'fee')
-- group by 1 order by total desc;

-- Pending transactions to review:
-- select * from transactions where status = 'pending' order by date desc;

-- Unreconciled transactions for a period:
-- select * from transactions
-- where reconciled = false and date between '2026-03-01' and '2026-03-31'
-- order by date;

-- Best matching classification rule for each pending transaction
-- (highest priority rule where all non-null conditions match):
-- select distinct on (t.id)
--     t.id, t.description, t.code,
--     r.type_override, r.category_id, r.priority
-- from transactions t
-- join accounts a on a.id = t.account_id
-- join classification_rules r on
--     (r.bank_name is null or r.bank_name = a.bank_name) and
--     (r.code is null or r.code = t.code) and
--     (r.description_pattern is null or t.description ilike r.description_pattern)
-- where t.status = 'pending'
-- order by t.id, r.priority desc;
