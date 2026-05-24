package core

import (
	"bank-transactions-ocr/app/internal/databases"
	"bank-transactions-ocr/app/internal/handlers"
	supabaserepo "bank-transactions-ocr/app/internal/repositories/supabase"
	"bank-transactions-ocr/app/internal/services"
)

type Config struct {
	SupabaseURL string
	SupabaseKey string
}

type App struct {
	ExtractHandler *handlers.ExtractHandler
	DumpHandler    *handlers.DumpHandler
}

func NewApp(cfg Config) *App {
	client := databases.NewSupabaseClient(cfg.SupabaseURL, cfg.SupabaseKey)

	accountRepo := supabaserepo.NewAccountRepository(client)
	txRepo := supabaserepo.NewTransactionRepository(client)
	classificationRepo := supabaserepo.NewClassificationRepository(client)

	classifier := services.NewClassificationService(classificationRepo)
	importer := services.NewImportService(accountRepo, txRepo, classifier)

	return &App{
		ExtractHandler: handlers.NewExtractHandler(importer),
		DumpHandler:    handlers.NewDumpHandler(),
	}
}
