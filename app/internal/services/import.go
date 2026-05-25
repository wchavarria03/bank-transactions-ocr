package services

import (
	"context"
	"fmt"

	"ledger-api/app/internal/models"
)

func NewImportService(
	accounts AccountRepository,
	transactions TransactionRepository,
	classifier *ClassificationService,
	userID string,
) *ImportService {
	return &ImportService{
		accounts:     accounts,
		transactions: transactions,
		classifier:   classifier,
		userID:       userID,
	}
}

func (s *ImportService) Import(ctx context.Context, stmt *models.Statement, bankName string) error {
	acc, err := s.accounts.FindByAccountNumber(ctx, stmt.AccountNumber)
	if err != nil {
		return fmt.Errorf("lookup account: %w", err)
	}

	if acc == nil {
		currency := "CRC"
		if len(stmt.Transactions) > 0 {
			currency = stmt.Transactions[0].Currency
		}

		name := bankName
		if len(stmt.AccountNumber) >= 4 {
			name = bankName + " - ****" + stmt.AccountNumber[len(stmt.AccountNumber)-4:]
		}

		acc, err = s.accounts.Upsert(ctx, &models.Account{
			AccountNumber: stmt.AccountNumber,
			ShortNumber:   stmt.ShortNumber,
			BankName:      bankName,
			Name:          name,
			Currency:      currency,
			UserID:        s.userID,
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
