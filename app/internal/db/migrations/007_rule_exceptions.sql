-- Migration 007: account_rule_exceptions
--
-- Allows disabling a global category_rule (account_id IS NULL) for a specific account.
-- Account-specific rules are always active and are not affected by this table.

create table account_rule_exceptions (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references auth.users(id) on delete cascade,
    account_id uuid not null references accounts(id)      on delete cascade,
    rule_id    uuid not null references category_rules(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (account_id, rule_id)
);

create index on account_rule_exceptions (account_id);

alter table account_rule_exceptions enable row level security;

create policy "account_rule_exceptions: user owns rows"
on account_rule_exceptions for all
using     (user_id = auth.uid())
with check (user_id = auth.uid());

grant all on table account_rule_exceptions to anon, authenticated, service_role;
