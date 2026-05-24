# Plan: Layered Architecture with DI

## Goal
Restructure the project into handlers → services → repositories with constructor-based
dependency injection. No DI framework — pure Go interfaces and constructor functions.

## Target Structure

```
internal/
  config/
    config.go              # Load SUPABASE_URL, SUPABASE_KEY from env; CLI flags
  domain/
    transaction.go         # Transaction, Statement, TransactionType — moved from parser/parser.go
    account.go             # Account type (mirrors DB row)
  pdf/
    extractor.go           # ProcessPDFs — moved from pdfextract/
    reader.go              # NewReader, GetNumPages, ExtractText — moved from pdfshellreader/
  parser/
    parser.go              # BankParser interface (uses domain.Statement, domain.Transaction)
    registry.go            # Register / Detect / List (unchanged)
    write.go               # WriteTransactions (unchanged, or moved to service layer later)
    parsers/bac/
      total_account.go     # BAC parser (unchanged logic)
  repository/
    account.go             # AccountRepository interface
    transaction.go         # TransactionRepository interface
    classification.go      # ClassificationRuleRepository interface
    supabase/
      client.go            # Supabase HTTP client (base URL + key + http.Client)
      account.go           # AccountRepository implementation
      transaction.go       # TransactionRepository implementation
      classification.go    # ClassificationRuleRepository implementation
  service/
    import.go              # ImportService: PDF → parse → classify → upsert
    classify.go            # ClassificationService: fetch rules, apply to transactions
    transfer.go            # TransferService: match transfers between accounts
cmd/
  root.go                  # Global flags + Config wiring
  extract.go               # Thin handler: builds deps, calls ImportService
  dump.go                  # Unchanged
  all.go                   # Unchanged
```

## Dependency Graph (bottom-up)

```
config  domain  pdf  parser
   \      |      |    /
    \     |      |   /
     repository (interfaces)
          |
     repository/supabase (implementations)
          |
        service
          |
         cmd
```

## Dependency Injection Pattern

Constructor injection — no framework needed at this scale:

```go
// repository/account.go
type AccountRepository interface {
    FindByAccountNumber(ctx context.Context, number string) (*domain.Account, error)
    Upsert(ctx context.Context, a *domain.Account) (*domain.Account, error)
}

// service/import.go
type ImportService struct {
    accounts     repository.AccountRepository
    transactions repository.TransactionRepository
    classifier   *ClassificationService
}

func NewImportService(
    accounts repository.AccountRepository,
    transactions repository.TransactionRepository,
    classifier *ClassificationService,
) *ImportService

// cmd/extract.go — wiring
cfg := config.Load()
client := supabase.NewClient(cfg.SupabaseURL, cfg.SupabaseKey)
svc := service.NewImportService(
    supabase.NewAccountRepository(client),
    supabase.NewTransactionRepository(client),
    service.NewClassificationService(supabase.NewClassificationRepository(client)),
)
```

## Steps

- [ ] 1. Create `internal/domain/` — move types from parser/parser.go, add Account
- [ ] 2. Merge `pdfextract` + `pdfshellreader` into `internal/pdf/`
- [ ] 3. Update `internal/parser/` to import from domain instead of defining types
- [ ] 4. Create `internal/config/config.go`
- [ ] 5. Create `internal/repository/` interfaces (account, transaction, classification)
- [ ] 6. Create `internal/repository/supabase/` client + implementations
- [ ] 7. Create `internal/service/` (import, classify, transfer)
- [ ] 8. Refactor `cmd/extract.go` to wire deps and call ImportService
- [ ] 9. Build + verify

## Notes
- Steps 1-3 are pure moves/renames — no logic change, just import path updates
- Steps 4-6 are new code only touched by step 7+
- Keep `write.go` in parser/ for now (file output as dry-run fallback)
- `--dry-run` flag in extract.go skips Supabase, writes to file instead
