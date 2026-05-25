-- Migration 003: user isolation
-- Requires migrations 001 and 002 to be applied first.
--
-- Adds user_id to directly-owned tables and enables Row Level Security
-- so each user can only read and write their own data.
-- auth.users is managed by Supabase Auth — no need to create it here.

-- ── Add user_id to directly-owned tables ────────────────────────────────────

alter table accounts
    add column user_id uuid not null references auth.users(id) on delete cascade;

alter table categories
    add column user_id uuid not null references auth.users(id) on delete cascade;

alter table classification_rules
    add column user_id uuid not null references auth.users(id) on delete cascade;

-- ── Indexes for RLS subquery performance ────────────────────────────────────

create index on accounts             (user_id);
create index on categories           (user_id);
create index on classification_rules (user_id);

-- ── Enable RLS on every table ───────────────────────────────────────────────

alter table accounts             enable row level security;
alter table categories           enable row level security;
alter table classification_rules enable row level security;
alter table transactions         enable row level security;
alter table transfers            enable row level security;

-- ── accounts ─────────────────────────────────────────────────────────────────

create policy "accounts: user owns rows"
on accounts for all
using     (user_id = auth.uid())
with check (user_id = auth.uid());

-- ── categories ───────────────────────────────────────────────────────────────

create policy "categories: user owns rows"
on categories for all
using     (user_id = auth.uid())
with check (user_id = auth.uid());

-- ── classification_rules ─────────────────────────────────────────────────────

create policy "classification_rules: user owns rows"
on classification_rules for all
using     (user_id = auth.uid())
with check (user_id = auth.uid());

-- ── transactions ─────────────────────────────────────────────────────────────
-- Ownership is derived through account_id → accounts.user_id.
-- No user_id column needed here.

create policy "transactions: user owns rows via account"
on transactions for all
using (
    account_id in (select id from accounts where user_id = auth.uid())
)
with check (
    account_id in (select id from accounts where user_id = auth.uid())
);

-- ── transfers ────────────────────────────────────────────────────────────────
-- Both sides of a transfer belong to the same user; checking from_tx_id is enough.

create policy "transfers: user owns rows via transaction"
on transfers for all
using (
    from_tx_id in (
        select t.id from transactions t
        join accounts a on a.id = t.account_id
        where a.user_id = auth.uid()
    )
)
with check (
    from_tx_id in (
        select t.id from transactions t
        join accounts a on a.id = t.account_id
        where a.user_id = auth.uid()
    )
);
