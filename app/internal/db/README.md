# Database Migrations

Applied manually via the Supabase SQL editor. Run in order — each migration
assumes the previous ones have been applied.

| # | File | Description |
|---|------|-------------|
| 001 | `001_initial_schema.sql` | accounts, categories, transactions, transfers |
| 002 | `002_classification_rules.sql` | classification rules for auto-tagging imports |

## Adding a new migration

1. Create `NNN_description.sql` where `NNN` is the next number in sequence.
2. Add a row to the table above.
3. Apply it in Supabase → SQL Editor, then commit the file.
