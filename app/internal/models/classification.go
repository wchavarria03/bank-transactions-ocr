package models

type ClassificationRule struct {
	ID                 string
	BankName           *string
	Code               *string
	DescriptionPattern *string
	TypeOverride       *TransactionType
	CategoryID         *string
	Priority           int
}
