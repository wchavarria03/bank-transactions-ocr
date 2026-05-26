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

type CategoryManager interface {
	List(ctx context.Context) ([]*models.Category, error)
	Create(ctx context.Context, c *models.Category) (*models.Category, error)
	Update(ctx context.Context, id string, fields map[string]string) (*models.Category, error)
	Delete(ctx context.Context, id string) error
	ListRules(ctx context.Context) ([]*models.CategoryRule, error)
	CreateRule(ctx context.Context, r *models.CategoryRule) (*models.CategoryRule, error)
	DeleteRule(ctx context.Context, id string) error
	SetTransactionCategories(ctx context.Context, transactionID string, categoryIDs []string) error
}
