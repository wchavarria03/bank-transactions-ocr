package parser

import "time"

// Transaction represents a single parsed bank transaction.
type Transaction struct {
	Date        time.Time
	Reference   string  // bank reference number — used for dedup and transfer matching
	Code        string  // transaction type code (e.g. TF, CP, TS, MD)
	Description string
	Amount      float64 // negative = debit, positive = credit
	Balance     float64
	Currency    string
}

// BankParser is implemented by each bank/format-specific parser.
type BankParser interface {
	// Name returns a human-readable identifier, e.g. "bac/statement".
	Name() string
	// Detect returns true if the extracted PDF text matches this parser's format.
	Detect(text string) bool
	// Parse extracts transactions from the full text of a PDF.
	Parse(text string) ([]Transaction, error)
}
