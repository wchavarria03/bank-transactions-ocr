package repositories

import (
	"context"

	"bank-transactions-ocr/app/internal/models"
)

type ClassificationRuleRepository interface {
	FindAll(ctx context.Context) ([]models.ClassificationRule, error)
}
