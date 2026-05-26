package services

import (
	"context"
	"fmt"

	"ledger-api/app/internal/models"
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

func (s *AccountService) GetByID(ctx context.Context, id string) (*models.Account, error) {
	account, err := s.accounts.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get account: %w", err)
	}
	return account, nil
}
