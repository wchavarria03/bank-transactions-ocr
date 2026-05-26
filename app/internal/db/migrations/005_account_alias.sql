-- Add optional user-defined alias to accounts.
-- When set, the UI shows alias instead of the auto-generated name.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS alias text;
