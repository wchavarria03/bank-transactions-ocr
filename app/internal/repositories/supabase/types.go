package supabase

import "bank-transactions-ocr/app/internal/databases"

type AccountRepository struct {
	client *databases.SupabaseClient
}

type TransactionRepository struct {
	client *databases.SupabaseClient
}

type ClassificationRepository struct {
	client *databases.SupabaseClient
}
