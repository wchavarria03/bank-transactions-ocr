package parser

import "time"

// TransactionType classifies a transaction independent of bank-specific codes.
type TransactionType string

const (
	TypeExpense     TransactionType = "expense"
	TypeIncome      TransactionType = "income"
	TypeTransferOut TransactionType = "transfer_out"
	TypeTransferIn  TransactionType = "transfer_in"
	TypeFee         TransactionType = "fee"
	TypeInterest    TransactionType = "interest"
)

// Transaction represents a single parsed bank transaction.
type Transaction struct {
	Date        time.Time
	Reference   string          // bank reference number — primary dedup key and transfer matching signal
	Code        string          // bank-specific type code (e.g. TF, CP, TS, MD)
	Type        TransactionType // normalized type, derived by the parser
	Description string
	Amount      float64 // negative = debit, positive = credit
	Balance     float64
	Currency    string
}

// Statement is the result of parsing a single PDF — one account's transactions
// plus the account identifiers extracted from the statement header.
//
// AccountNumber is the full identifier (e.g. IBAN "CR04010200009331755567").
// ShortNumber is the bank-specific shorter form that appears inside transfer
// descriptions (e.g. "TEF A : 701979726" or "TEF DE: 933175556"). Each bank
// parser implements its own extraction rule for ShortNumber.
//
// Transfer matching priority:
//   1. Same Reference across accounts (strongest signal)
//   2. Description contains counterpart's ShortNumber (TEF A/DE patterns)
//   3. Same date + same absolute amount across accounts (weakest, needs confirmation)
type Statement struct {
	AccountNumber string // full account identifier; empty if not found in PDF
	ShortNumber   string // bank-specific short form used in transfer descriptions
	Transactions  []Transaction
}

// BankParser is implemented by each bank/format-specific parser.
type BankParser interface {
	// Name returns a human-readable identifier, e.g. "bac/total-account".
	Name() string
	// Detect returns true if the extracted PDF text matches this parser's format.
	Detect(text string) bool
	// Parse extracts the account number and transactions from the full text of a PDF.
	Parse(text string) (*Statement, error)
}
