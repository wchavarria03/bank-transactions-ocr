package supabase

import (
	"context"

	"bank-transactions-ocr/app/internal/databases"
	"bank-transactions-ocr/app/internal/models"
)

type ClassificationRepository struct {
	client *databases.SupabaseClient
}

func NewClassificationRepository(client *databases.SupabaseClient) *ClassificationRepository {
	return &ClassificationRepository{client: client}
}

func (r *ClassificationRepository) FindAll(ctx context.Context) ([]models.ClassificationRule, error) {
	// TODO: GET /rest/v1/classification_rules?order=priority.desc
	return nil, nil
}
