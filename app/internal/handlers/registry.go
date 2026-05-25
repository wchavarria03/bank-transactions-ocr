package handlers

import "ledger-api/app/internal/services"

// Registry holds all HTTP handlers.
type Registry struct {
	Account *AccountHandler
	Dump    *DumpHandler
	Extract *ExtractHandler
}

func NewRegistry(svc *services.Registry) (*Registry, error) {
	return &Registry{
		Account: NewAccountHandler(svc.Account),
		Dump:    NewDumpHandler(),
		Extract: NewExtractHandler(svc.Import),
	}, nil
}

// Close releases any resources held by handlers.
//
//nolint:revive // receiver intentionally unused; method provided for consistency and future extensibility
func (r *Registry) Close() error {
	return nil
}
