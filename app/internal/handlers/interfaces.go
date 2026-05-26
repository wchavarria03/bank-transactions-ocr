package handlers

import (
	"context"

	"ledger-api/app/internal/models"
)

type Importer interface {
	Import(ctx context.Context, stmt *models.Statement, bankName string) error
}

type AccountLister interface {
	List(ctx context.Context) ([]*models.Account, error)
	GetByID(ctx context.Context, id string) (*models.Account, error)
	Create(ctx context.Context, a *models.Account) (*models.Account, error)
	Update(ctx context.Context, id string, fields map[string]string) (*models.Account, error)
}

type TransactionLister interface {
	ListByAccount(ctx context.Context, accountID string) ([]*models.Transaction, error)
}
