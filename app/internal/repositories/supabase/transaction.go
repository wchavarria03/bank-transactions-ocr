package supabase

import (
	"context"
	"net/url"
	"time"

	"github.com/shopspring/decimal"

	"ledger-api/app/internal/databases"
	"ledger-api/app/internal/models"
)

// transactionRow is the DB shape for a transaction — includes account_id which is absent from models.Transaction.
type transactionRow struct {
	ID          string          `json:"id,omitempty"`
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

func (r *TransactionRepository) GetByAccountID(ctx context.Context, accountID string) ([]*models.Transaction, error) {
	rows, err := databases.Get[[]*transactionRow](ctx, r.client, "/rest/v1/transactions", url.Values{
		"account_id": []string{"eq." + accountID},
		"order":      []string{"date.desc"},
	})
	if err != nil {
		return nil, err
	}
	txs := make([]*models.Transaction, len(rows))
	for i, row := range rows {
		date, _ := time.Parse("2006-01-02", row.Date)
		txs[i] = &models.Transaction{
			ID:          row.ID,
			Date:        date,
			Reference:   row.Reference,
			Code:        row.Code,
			Type:        models.TransactionType(row.Type),
			Description: row.Description,
			Amount:      row.Amount,
			Balance:     row.Balance,
			Currency:    row.Currency,
		}
	}
	return txs, nil
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
	_, err := databases.Post[struct{}](ctx, r.client,
		"/rest/v1/transactions?on_conflict=account_id,date,reference,amount",
		rows, "resolution=ignore-duplicates")
	return err
}
