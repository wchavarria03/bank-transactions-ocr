-- Migration 002: classification rules
-- Requires migration 001 to be applied first.

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
