-- Migration 006: categories v2 — multi-user, soft-delete, many-to-many, rules
--
-- Changes to existing categories table:
--   • user_id made nullable  (NULL = global default, visible to all users)
--   • deleted_at added       (soft-delete; RLS filters it out)
--   • unique(name,parent_id) constraint dropped (user-scoped names allowed)
--   • RLS policy replaced    (SELECT allows global + own rows)
--
-- New tables:
--   • transaction_categories — many-to-many (replaces transactions.category_id)
--   • category_rules         — auto-categorization patterns per user/account

-- ── Alter categories ─────────────────────────────────────────────────────────

alter table categories
    alter column user_id drop not null;

alter table categories
    add column deleted_at timestamptz;

-- Drop old name uniqueness (scoped below per user vs global via partial indexes)
alter table categories
    drop constraint if exists categories_name_parent_id_key;

-- Global categories: unique name per parent
create unique index if not exists categories_global_name_unique
    on categories (name, coalesce(parent_id::text, ''))
    where user_id is null and deleted_at is null;

-- User categories: unique name per parent per user
create unique index if not exists categories_user_name_unique
    on categories (user_id, name, coalesce(parent_id::text, ''))
    where user_id is not null and deleted_at is null;

-- Replace RLS policy: allow global rows + own rows, hide deleted
drop policy if exists "categories: user owns rows" on categories;

create policy "categories: select global and own"
on categories for select
using (deleted_at is null and (user_id is null or user_id = auth.uid()));

create policy "categories: insert own"
on categories for insert
with check (user_id = auth.uid());

create policy "categories: update own"
on categories for update
using (user_id = auth.uid());

create policy "categories: delete own"
on categories for delete
using (user_id = auth.uid());

-- ── transaction_categories ───────────────────────────────────────────────────

create table transaction_categories (
    transaction_id uuid not null references transactions(id) on delete cascade,
    category_id    uuid not null references categories(id)   on delete cascade,
    primary key (transaction_id, category_id)
);

alter table transaction_categories enable row level security;

create policy "transaction_categories: user owns via account"
on transaction_categories for all
using (
    exists (
        select 1
        from transactions t
        join accounts a on a.id = t.account_id
        where t.id = transaction_id and a.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from transactions t
        join accounts a on a.id = t.account_id
        where t.id = transaction_id and a.user_id = auth.uid()
    )
);

-- ── category_rules ───────────────────────────────────────────────────────────

create table category_rules (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    account_id  uuid references accounts(id) on delete cascade,  -- null = all accounts
    pattern     text not null,
    category_id uuid not null references categories(id) on delete cascade,
    priority    int  not null default 0,
    created_at  timestamptz not null default now()
);

create index on category_rules (user_id);

alter table category_rules enable row level security;

create policy "category_rules: user owns rows"
on category_rules for all
using     (user_id = auth.uid())
with check (user_id = auth.uid());

-- ── Grants ───────────────────────────────────────────────────────────────────

grant all on table transaction_categories to anon, authenticated, service_role;
grant all on table category_rules         to anon, authenticated, service_role;

-- ── Seed global default categories ──────────────────────────────────────────

insert into categories (name, parent_id, user_id, color) values
    ('Income',        null, null, '#22c55e'),
    ('Food',          null, null, '#f97316'),
    ('Housing',       null, null, '#3b82f6'),
    ('Transport',     null, null, '#8b5cf6'),
    ('Health',        null, null, '#ec4899'),
    ('Entertainment', null, null, '#f59e0b'),
    ('Transfers',     null, null, '#6b7280'),
    ('Fees',          null, null, '#ef4444');

insert into categories (name, parent_id, user_id, color) select 'Salary',         id, null, '#16a34a' from categories where name = 'Income'        and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Freelance',      id, null, '#15803d' from categories where name = 'Income'        and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Interest',       id, null, '#4ade80' from categories where name = 'Income'        and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Refund',         id, null, '#86efac' from categories where name = 'Income'        and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Groceries',      id, null, '#ea580c' from categories where name = 'Food'          and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Restaurants',    id, null, '#c2410c' from categories where name = 'Food'          and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Coffee',         id, null, '#fb923c' from categories where name = 'Food'          and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Rent',           id, null, '#1d4ed8' from categories where name = 'Housing'       and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Utilities',      id, null, '#2563eb' from categories where name = 'Housing'       and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Maintenance',    id, null, '#60a5fa' from categories where name = 'Housing'       and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Fuel',           id, null, '#7c3aed' from categories where name = 'Transport'     and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Public Transit', id, null, '#a78bfa' from categories where name = 'Transport'     and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Parking',        id, null, '#c4b5fd' from categories where name = 'Transport'     and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Pharmacy',       id, null, '#db2777' from categories where name = 'Health'        and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Medical',        id, null, '#be185d' from categories where name = 'Health'        and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Streaming',      id, null, '#d97706' from categories where name = 'Entertainment' and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Dining Out',     id, null, '#b45309' from categories where name = 'Entertainment' and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Sports',         id, null, '#92400e' from categories where name = 'Entertainment' and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Transfer In',    id, null, '#4b5563' from categories where name = 'Transfers'     and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Transfer Out',   id, null, '#374151' from categories where name = 'Transfers'     and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Bank Fee',       id, null, '#dc2626' from categories where name = 'Fees'          and user_id is null;
insert into categories (name, parent_id, user_id, color) select 'Tax',            id, null, '#b91c1c' from categories where name = 'Fees'          and user_id is null;
