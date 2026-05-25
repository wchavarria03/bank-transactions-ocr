package supabase

import (
	"context"
	"net/url"

	"bank-transactions-ocr/app/internal/databases"
	"bank-transactions-ocr/app/internal/models"
)

func NewClassificationRepository(client *databases.SupabaseClient) *ClassificationRepository {
	return &ClassificationRepository{client: client}
}

func (r *ClassificationRepository) FindAll(ctx context.Context) ([]models.ClassificationRule, error) {
	return databases.Get[[]models.ClassificationRule](ctx, r.client, "/rest/v1/classification_rules", url.Values{
		"order": []string{"priority.desc"},
	})
}
