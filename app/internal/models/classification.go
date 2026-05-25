package models

type ClassificationRule struct {
	ID                 string           `json:"id"`
	BankName           *string          `json:"bank_name"`
	Code               *string          `json:"code"`
	DescriptionPattern *string          `json:"description_pattern"`
	TypeOverride       *TransactionType `json:"type_override"`
	CategoryID         *string          `json:"category_id"`
	Priority           int              `json:"priority"`
}
