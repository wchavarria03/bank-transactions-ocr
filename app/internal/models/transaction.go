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
	Date        time.Time
	Reference   string
	Code        string
	Type        TransactionType
	Description string
	Amount      decimal.Decimal
	Balance     decimal.Decimal
	Currency    string
}

type Statement struct {
	AccountNumber string
	ShortNumber   string
	SourceFile    string
	Transactions  []Transaction
}
