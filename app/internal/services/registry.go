package services

import "bank-transactions-ocr/app/internal/repositories"

type Registry struct {
	Account        *AccountService
	Classification *ClassificationService
	Import         *ImportService
	Transfer       *TransferService
}

func NewRegistry(repos *repositories.Registry) *Registry {
	classifier := NewClassificationService(repos.Classifications)
	return &Registry{
		Account:        NewAccountService(repos.Accounts),
		Classification: classifier,
		Import:         NewImportService(repos.Accounts, repos.Transactions, classifier),
		Transfer:       NewTransferService(),
	}
}
