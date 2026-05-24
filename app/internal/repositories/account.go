package repositories

import (
	"context"

	"bank-transactions-ocr/app/internal/models"
)

type AccountRepository interface {
	FindByAccountNumber(ctx context.Context, number string) (*models.Account, error)
	Upsert(ctx context.Context, a *models.Account) (*models.Account, error)
}
