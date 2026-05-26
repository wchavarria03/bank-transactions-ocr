package supabase

import (
	"context"
	"net/url"
	"strings"
	"time"

	"github.com/shopspring/decimal"

	"ledger-api/app/internal/databases"
	"ledger-api/app/internal/models"
)

// transactionRow is the write shape — used for UpsertBatch only.
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

// transactionRowFull is the read shape — includes embedded category join.
type transactionRowFull struct {
	ID                    string             `json:"id,omitempty"`
	AccountID             string             `json:"account_id"`
	Date                  string             `json:"date"`
	Reference             string             `json:"reference,omitempty"`
	Code                  string             `json:"code,omitempty"`
	Type                  string             `json:"type"`
	Description           string             `json:"description"`
	Amount                decimal.Decimal    `json:"amount"`
	Balance               decimal.Decimal    `json:"balance"`
	Currency              string             `json:"currency"`
	TransactionCategories []txCategoryEmbed  `json:"transaction_categories"`
}

type txCategoryEmbed struct {
	Category *models.Category `json:"categories"`
}

func NewTransactionRepository(client *databases.SupabaseClient) *TransactionRepository {
	return &TransactionRepository{client: client}
}

func (r *TransactionRepository) GetByAccountID(ctx context.Context, accountID string) ([]*models.Transaction, error) {
	rows, err := databases.Get[[]*transactionRowFull](ctx, r.client, "/rest/v1/transactions", url.Values{
		"account_id": []string{"eq." + accountID},
		"select":     []string{"*,transaction_categories(categories(id,name,color,parent_id))"},
		"order":      []string{"date.desc"},
	})
	if err != nil {
		return nil, err
	}
	txs := make([]*models.Transaction, len(rows))
	for i, row := range rows {
		date, _ := time.Parse("2006-01-02", row.Date)
		cats := make([]*models.Category, 0, len(row.TransactionCategories))
		for _, tc := range row.TransactionCategories {
			if tc.Category != nil {
				cats = append(cats, tc.Category)
			}
		}
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
			Categories:  cats,
		}
	}
	return txs, nil
}

func (r *TransactionRepository) GetByAccountIDsInRange(ctx context.Context, accountIDs []string, from, to time.Time) ([]*models.Transaction, error) {
	rows, err := databases.Get[[]*transactionRowFull](ctx, r.client, "/rest/v1/transactions", url.Values{
		"account_id": []string{"in.(" + strings.Join(accountIDs, ",") + ")"},
		"date":       []string{"gte." + from.Format("2006-01-02"), "lte." + to.Format("2006-01-02")},
		"select":     []string{"*,transaction_categories(categories(id,name,color,parent_id))"},
		"order":      []string{"date.asc"},
	})
	if err != nil {
		return nil, err
	}
	txs := make([]*models.Transaction, len(rows))
	for i, row := range rows {
		date, _ := time.Parse("2006-01-02", row.Date)
		cats := make([]*models.Category, 0, len(row.TransactionCategories))
		for _, tc := range row.TransactionCategories {
			if tc.Category != nil {
				cats = append(cats, tc.Category)
			}
		}
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
			Categories:  cats,
		}
	}
	return txs, nil
}

// GetLastBalanceBefore returns the running balance of the most recent transaction
// across the given accounts that occurred strictly before the given date.
// Returns 0 if no prior transactions exist.
func (r *TransactionRepository) GetLastBalanceBefore(ctx context.Context, accountIDs []string, before time.Time) (float64, error) {
	rows, err := databases.Get[[]*transactionRowFull](ctx, r.client, "/rest/v1/transactions", url.Values{
		"account_id": []string{"in.(" + strings.Join(accountIDs, ",") + ")"},
		"date":       []string{"lt." + before.Format("2006-01-02")},
		"select":     []string{"balance"},
		"order":      []string{"date.desc"},
		"limit":      []string{"1"},
	})
	if err != nil {
		return 0, err
	}
	if len(rows) == 0 {
		return 0, nil
	}
	bal, _ := rows[0].Balance.Float64()
	return bal, nil
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
