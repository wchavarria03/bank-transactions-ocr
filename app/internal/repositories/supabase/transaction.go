package supabase

import (
	"context"

	"github.com/shopspring/decimal"

	"ledger-api/app/internal/databases"
	"ledger-api/app/internal/models"
)

// transactionRow is the DB shape for a transaction — includes account_id which is absent from models.Transaction.
type transactionRow struct {
	AccountID   string          `json:"account_id"`
	Date        string          `json:"date"`
	Reference   string          `json:"reference,omitempty"`
	Code        string          `json:"code,omitempty"`
	Type        string          `json:"type"`
	Description string          `json:"description"`
	Amount      decimal.Decimal `json:"amount"`
	Balance     decimal.Decimal `json:"balance"`
	Currency    string          `json:"currency"`
	SourceFile  string          `json:"source_file,omitempty"`
}

func NewTransactionRepository(client *databases.SupabaseClient) *TransactionRepository {
	return &TransactionRepository{client: client}
}

func (r *TransactionRepository) UpsertBatch(ctx context.Context, accountID string, sourceFile string, txs []models.Transaction) error {
	rows := make([]transactionRow, len(txs))
	for i, tx := range txs {
		rows[i] = transactionRow{
			AccountID:   accountID,
			Date:        tx.Date.Format("2006-01-02"),
			Reference:   tx.Reference,
			Code:        tx.Code,
			Type:        string(tx.Type),
			Description: tx.Description,
			Amount:      tx.Amount,
			Balance:     tx.Balance,
			Currency:    tx.Currency,
			SourceFile:  sourceFile,
		}
	}
	_, err := databases.Post[struct{}](ctx, r.client, "/rest/v1/transactions", rows,
		"resolution=ignore-duplicates")
	return err
}
