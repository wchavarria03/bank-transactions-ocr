package services

import (
	"context"

	"ledger-api/app/internal/models"
)

type AccountRepository interface {
	FindAll(ctx context.Context) ([]*models.Account, error)
	FindByAccountNumber(ctx context.Context, number string) (*models.Account, error)
	Upsert(ctx context.Context, a *models.Account) (*models.Account, error)
}

type TransactionRepository interface {
	UpsertBatch(ctx context.Context, accountID string, sourceFile string, txs []models.Transaction) error
}

type ClassificationRuleRepository interface {
	FindAll(ctx context.Context) ([]models.ClassificationRule, error)
}
