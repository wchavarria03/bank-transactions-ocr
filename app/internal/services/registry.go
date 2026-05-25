package services

import "ledger-api/app/internal/repositories"

type Registry struct {
	Account        *AccountService
	Classification *ClassificationService
	Import         *ImportService
	Transaction    *TransactionService
	Transfer       *TransferService
}

func NewRegistry(repos *repositories.Registry, userID string) *Registry {
	classifier := NewClassificationService(repos.Classifications)
	return &Registry{
		Account:        NewAccountService(repos.Accounts),
		Classification: classifier,
		Import:         NewImportService(repos.Accounts, repos.Transactions, classifier, userID),
		Transaction:    NewTransactionService(repos.Transactions),
		Transfer:       NewTransferService(),
	}
}
