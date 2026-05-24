package models

import "time"

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
	Amount      float64
	Balance     float64
	Currency    string
}

type Statement struct {
	AccountNumber string
	ShortNumber   string
	Transactions  []Transaction
}
