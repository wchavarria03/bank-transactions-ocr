package models

import (
	"time"

	"github.com/shopspring/decimal"
)

type TransactionType string

const (
	TypeExpense     TransactionType = "expense"
	TypeIncome      TransactionType = "income"
	TypeTransferOut TransactionType = "transfer_out"
	TypeTransferIn  TransactionType = "transfer_in"
	TypeFee         TransactionType = "fee"
	TypeInterest    TransactionType = "interest"
)

type Transaction struct {
	ID          string          `json:"id,omitempty"`
	Date        time.Time       `json:"date"`
	Reference   string          `json:"reference,omitempty"`
	Code        string          `json:"code,omitempty"`
	Type        TransactionType `json:"type"`
	Description string          `json:"description"`
	Amount      decimal.Decimal `json:"amount"`
	Balance     decimal.Decimal `json:"balance"`
	Currency    string          `json:"currency"`
	Categories  []*Category     `json:"categories,omitempty"`
}

type Statement struct {
	AccountNumber string
	ShortNumber   string
	SourceFile    string
	Transactions  []Transaction
}
