package handlers

import "ledger-api/app/internal/services"

// Registry holds all HTTP handlers.
type Registry struct {
	Account     *AccountHandler
	Category    *CategoryHandler
	Dump        *DumpHandler
	Extract     *ExtractHandler
	Me          *MeHandler
	Report      *ReportHandler
	Transaction *TransactionHandler
}

func NewRegistry(svc *services.Registry) (*Registry, error) {
	return &Registry{
		Account:     NewAccountHandler(svc.Account),
		Category:    NewCategoryHandler(svc.Category),
		Dump:        NewDumpHandler(),
		Extract:     NewExtractHandler(svc.Import),
		Me:          NewMeHandler(),
		Report:      NewReportHandler(svc.Account, svc.Report),
		Transaction: NewTransactionHandler(svc.Transaction),
	}, nil
}

// Close releases any resources held by handlers.
//
//nolint:revive // receiver intentionally unused; method provided for consistency and future extensibility
func (r *Registry) Close() error {
	return nil
}
