# Phase 4 — Custom Categories Management

## Goal
Allow users to categorize transactions with a 2-level hierarchy (parent → child),
auto-assign categories via rules during file processing, and manage everything
through the UI.

## Data Model

```
categories
  id UUID PK
  name TEXT NOT NULL
  parent_id UUID → categories(id)   -- NULL = top-level
  user_id UUID → auth.users(id)     -- NULL = global default, SET = user-specific
  color TEXT                        -- hex color for UI badges
  created_at TIMESTAMPTZ

transaction_categories              -- join table, 1..n categories per transaction
  transaction_id UUID → transactions(id)
  category_id    UUID → categories(id)
  PRIMARY KEY (transaction_id, category_id)

category_rules
  id UUID PK
  user_id    UUID → auth.users(id)
  account_id UUID → accounts(id)    -- NULL = all accounts, SET = account-specific
  pattern    TEXT NOT NULL          -- case-insensitive substring match on description
  category_id UUID → categories(id)
  priority   INT DEFAULT 0          -- higher = evaluated first
  created_at TIMESTAMPTZ
```

**Category visibility rule:** users see `user_id IS NULL` (globals) UNION their own (`user_id = auth.uid()`).
**Override:** a user category with the same name as a global takes precedence in the UI.

---

## Backend Steps

### [ ] 1. Migration 006 — categories + transaction_categories + category_rules
- Create all three tables
- RLS policies:
  - `categories`: SELECT global OR own; INSERT/UPDATE/DELETE own only
  - `transaction_categories`: full access scoped to own transactions
  - `category_rules`: full access scoped to own rules
- Seed ~15 global default categories (see seed list below)

**Global seed categories:**
```
Income         → Salary, Freelance, Interest, Refund
Food           → Groceries, Restaurants, Coffee
Housing        → Rent, Utilities, Maintenance
Transport      → Fuel, Public Transit, Parking
Health         → Pharmacy, Medical
Entertainment  → Streaming, Dining Out, Sports
Transfers      → Transfer In, Transfer Out
Fees           → Bank Fee, Tax
```

### [ ] 2. Go models
- `models/category.go`: `Category { ID, Name, ParentID, UserID, Color, Children }`
- `models/category_rule.go`: `CategoryRule { ID, UserID, AccountID, Pattern, CategoryID, Priority }`

### [ ] 3. Repository interfaces (services/interfaces.go)
```go
CategoryRepository:
  FindAll(ctx) ([]*Category, error)           -- global + user's own
  FindByID(ctx, id) (*Category, error)
  Create(ctx, c *Category) (*Category, error)
  Update(ctx, id, fields) (*Category, error)
  Delete(ctx, id) error

CategoryRuleRepository:
  FindAll(ctx) ([]*CategoryRule, error)
  FindByAccountID(ctx, accountID) ([]*CategoryRule, error)
  Create(ctx, r *CategoryRule) (*CategoryRule, error)
  Delete(ctx, id) error

TransactionCategoryRepository:
  SetCategories(ctx, transactionID, categoryIDs []string) error
  GetByTransactionID(ctx, transactionID) ([]*Category, error)
```

### [ ] 4. Supabase repository implementations
- `repositories/supabase/category.go`
- `repositories/supabase/category_rule.go`
- `repositories/supabase/transaction_category.go`

### [ ] 5. Services
- `services/category.go`: CRUD, BuildTree (nest children under parents)
- `services/category_rule.go`: CRUD
- `services/transaction_categorizer.go`:
  - `ApplyRules(ctx, accountID, tx *Transaction) ([]string, error)`
  - Loads rules for account + global rules, sorts by priority, first match wins

### [ ] 6. Handlers
New routes:
```
GET    /v1/categories              -- flat list with children nested
POST   /v1/categories              -- create (parent or child)
PATCH  /v1/categories/:id          -- rename / recolor
DELETE /v1/categories/:id          -- soft-delete (keep on existing transactions)

GET    /v1/category-rules          -- all rules for the user
POST   /v1/category-rules
DELETE /v1/category-rules/:id

GET    /v1/transactions/:id/categories
PATCH  /v1/transactions/:id/categories  -- body: { category_ids: [...] }
```

### [ ] 7. Wire up auto-categorization in transaction ingestion
- After `UpsertBatch`, call `ApplyRules` for each new transaction
- Only assign if transaction has no categories yet (don't override manual choices)

### [ ] 8. Update transaction response to include categories
- `GET /v1/accounts/:id/transactions` — each transaction carries its categories

---

## Frontend Steps

### [ ] 9. Types
```typescript
interface Category {
  id: string
  name: string
  parent_id?: string
  user_id?: string
  color?: string
  children?: Category[]
}

interface CategoryRule {
  id: string
  account_id?: string
  pattern: string
  category_id: string
  priority: number
}
```

### [ ] 10. API functions (lib/api.ts)
- `getCategories()`, `createCategory()`, `updateCategory()`, `deleteCategory()`
- `getCategoryRules()`, `createCategoryRule()`, `deleteCategoryRule()`
- `updateTransactionCategories(txId, categoryIds[])`

### [ ] 11. Transaction page — category column + inline picker
- Add "Category" column to transactions table
- Click on cell → dropdown showing category tree (parent → children)
- Selected categories shown as colored badges
- Supports selecting multiple

### [ ] 12. Settings page — category management
- New route `/settings/categories`
- Two-column layout: parent categories on left, children on right
- Add / rename / delete categories
- Color picker per category

### [ ] 13. Settings page — rules management
- Section below categories (or separate tab)
- Table: Pattern | Category | Account (optional) | Priority
- Add rule form: pattern input + category dropdown + optional account selector
- Delete rule

### [ ] 14. Navbar — add Settings link

---

## Open Questions (decide before step 1)
- [ ] Should `DELETE /v1/categories/:id` hard-delete or soft-delete?
  → Recommend soft-delete (`deleted_at` column) so existing transaction_categories
    keep their FK intact without cascade nulling.
- [ ] Color format: hex string (`#f59e0b`) stored in DB, or Tailwind color name?
  → Recommend hex — framework-agnostic.
