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
}
