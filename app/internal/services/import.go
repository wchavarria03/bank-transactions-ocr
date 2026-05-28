package services

import (
	"context"
	"fmt"
	"strings"

	"ledger-api/app/internal/auth"
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
	_, err := s.doImport(ctx, stmt, bankName)
	return err
}

func (s *ImportService) ImportWithSummary(ctx context.Context, stmt *models.Statement, bankName string) (*models.ImportSummary, error) {
	acc, err := s.doImport(ctx, stmt, bankName)
	if err != nil {
		return nil, err
	}
	bank := bankName
	if idx := strings.Index(bankName, "/"); idx != -1 {
		bank = bankName[:idx]
	}
	return &models.ImportSummary{
		AccountName:   acc.Name,
		AccountNumber: stmt.AccountNumber,
		Currency:      acc.Currency,
		Bank:          bank,
		ImportedCount: len(stmt.Transactions),
	}, nil
}

func (s *ImportService) doImport(ctx context.Context, stmt *models.Statement, bankName string) (*models.Account, error) {
	bank := bankName
	if idx := strings.Index(bankName, "/"); idx != -1 {
		bank = bankName[:idx]
	}

	// Prefer the user ID from the JWT context; fall back to the static value for CLI use.
	userID := auth.UserIDFromContext(ctx)
	if userID == "" {
		userID = s.userID
	}

	acc, err := s.accounts.FindByAccountNumber(ctx, stmt.AccountNumber)
	if err != nil {
		return nil, fmt.Errorf("lookup account: %w", err)
	}

	if acc == nil {
		currency := "CRC"
		if len(stmt.Transactions) > 0 {
			currency = stmt.Transactions[0].Currency
		}

		name := strings.ToUpper(bank)
		if len(stmt.AccountNumber) >= 4 {
			name = strings.ToUpper(bank) + " - ****" + stmt.AccountNumber[len(stmt.AccountNumber)-4:]
		}

		acc, err = s.accounts.Upsert(ctx, &models.Account{
			AccountNumber: stmt.AccountNumber,
			ShortNumber:   stmt.ShortNumber,
			BankName:      bank,
			Name:          name,
			Currency:      currency,
			UserID:        userID,
		})
		if err != nil {
			return nil, fmt.Errorf("upsert account: %w", err)
		}
	}

	txs, err := s.classifier.Apply(ctx, bank, stmt.Transactions)
	if err != nil {
		return nil, fmt.Errorf("classify transactions: %w", err)
	}

	if err := s.transactions.UpsertBatch(ctx, acc.ID, stmt.SourceFile, txs); err != nil {
		return nil, fmt.Errorf("upsert transactions: %w", err)
	}

	return acc, nil
}
