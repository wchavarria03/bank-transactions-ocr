package services

import (
	"context"

	"ledger-api/app/internal/models"
)

type TransactionService struct {
	repo TransactionRepository
}

func NewTransactionService(repo TransactionRepository) *TransactionService {
	return &TransactionService{repo: repo}
}

func (s *TransactionService) ListByAccount(ctx context.Context, accountID string) ([]*models.Transaction, error) {
	return s.repo.GetByAccountID(ctx, accountID)
}
