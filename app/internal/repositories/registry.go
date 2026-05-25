package repositories

import (
	"bank-transactions-ocr/app/internal/databases"
	supabaserepo "bank-transactions-ocr/app/internal/repositories/supabase"
)

type Registry struct {
	Accounts        *supabaserepo.AccountRepository
	Transactions    *supabaserepo.TransactionRepository
	Classifications *supabaserepo.ClassificationRepository
}

func NewRegistry(dbs *databases.Registry) *Registry {
	return &Registry{
		Accounts:        supabaserepo.NewAccountRepository(dbs.Supabase),
		Transactions:    supabaserepo.NewTransactionRepository(dbs.Supabase),
		Classifications: supabaserepo.NewClassificationRepository(dbs.Supabase),
	}
}
