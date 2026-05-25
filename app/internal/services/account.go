package services

import (
	"context"
	"fmt"

	"bank-transactions-ocr/app/internal/models"
)

func NewAccountService(accounts AccountRepository) *AccountService {
	return &AccountService{accounts: accounts}
}

func (s *AccountService) List(ctx context.Context) ([]*models.Account, error) {
	accounts, err := s.accounts.FindAll(ctx)
	if err != nil {
		return nil, fmt.Errorf("list accounts: %w", err)
	}
	return accounts, nil
}
