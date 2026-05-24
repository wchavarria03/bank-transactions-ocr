package supabase

import (
	"context"

	"bank-transactions-ocr/app/internal/databases"
	"bank-transactions-ocr/app/internal/models"
)

type AccountRepository struct {
	client *databases.SupabaseClient
}

func NewAccountRepository(client *databases.SupabaseClient) *AccountRepository {
	return &AccountRepository{client: client}
}

func (r *AccountRepository) FindByAccountNumber(ctx context.Context, number string) (*models.Account, error) {
	// TODO: GET /rest/v1/accounts?account_number=eq.<number>
	return nil, nil
}

func (r *AccountRepository) Upsert(ctx context.Context, a *models.Account) (*models.Account, error) {
	// TODO: POST /rest/v1/accounts with Prefer: resolution=merge-duplicates
	return a, nil
}
