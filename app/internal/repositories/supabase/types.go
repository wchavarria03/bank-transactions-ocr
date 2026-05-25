package supabase

import "ledger-api/app/internal/databases"

type AccountRepository struct {
	client *databases.SupabaseClient
}

type TransactionRepository struct {
	client *databases.SupabaseClient
}

type ClassificationRepository struct {
	client *databases.SupabaseClient
}
