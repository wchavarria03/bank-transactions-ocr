package supabase

import (
	"context"

	"bank-transactions-ocr/app/internal/databases"
	"bank-transactions-ocr/app/internal/models"
)

type TransactionRepository struct {
	client *databases.SupabaseClient
}

func NewTransactionRepository(client *databases.SupabaseClient) *TransactionRepository {
	return &TransactionRepository{client: client}
}

func (r *TransactionRepository) UpsertBatch(ctx context.Context, accountID string, txs []models.Transaction) error {
	// TODO: POST /rest/v1/transactions with Prefer: resolution=ignore-duplicates
	return nil
}
