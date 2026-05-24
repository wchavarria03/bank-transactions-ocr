package repositories

import (
	"context"

	"bank-transactions-ocr/app/internal/models"
)

type TransactionRepository interface {
	UpsertBatch(ctx context.Context, accountID string, txs []models.Transaction) error
}
