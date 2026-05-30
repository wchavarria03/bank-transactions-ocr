package models

type ImportPreview struct {
	AccountNumber    string        `json:"account_number"`
	Bank             string        `json:"bank"`
	Currency         string        `json:"currency"`
	TransactionCount int           `json:"transaction_count"`
	PeriodStart      string        `json:"period_start"`
	PeriodEnd        string        `json:"period_end"`
	Sample           []Transaction `json:"sample"`
	ExistingCount    int           `json:"existing_count"`
}

type ImportSummary struct {
	AccountName   string `json:"account_name"`
	AccountNumber string `json:"account_number"`
	Currency      string `json:"currency"`
	Bank          string `json:"bank"`
	ImportedCount int    `json:"imported_count"`
}
