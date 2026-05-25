package services

import (
	"context"
	"fmt"

	"bank-transactions-ocr/app/internal/models"
)

func NewImportService(
	accounts AccountRepository,
	transactions TransactionRepository,
	classifier *ClassificationService,
) *ImportService {
	return &ImportService{
		accounts:     accounts,
		transactions: transactions,
		classifier:   classifier,
	}
}

func (s *ImportService) Import(ctx context.Context, stmt *models.Statement, bankName string) error {
	acc, err := s.accounts.FindByAccountNumber(ctx, stmt.AccountNumber)
	if err != nil {
		return fmt.Errorf("lookup account: %w", err)
	}

	if acc == nil {
		acc, err = s.accounts.Upsert(ctx, &models.Account{
			AccountNumber: stmt.AccountNumber,
			ShortNumber:   stmt.ShortNumber,
			BankName:      bankName,
		})
		if err != nil {
			return fmt.Errorf("upsert account: %w", err)
		}
	}

	txs, err := s.classifier.Apply(ctx, bankName, stmt.Transactions)
	if err != nil {
		return fmt.Errorf("classify transactions: %w", err)
	}

	if err := s.transactions.UpsertBatch(ctx, acc.ID, txs); err != nil {
		return fmt.Errorf("upsert transactions: %w", err)
	}

	return nil
}
