package core

import (
	"fmt"

	"bank-transactions-ocr/app/internal/databases"
	"bank-transactions-ocr/app/internal/handlers"
	httpserver "bank-transactions-ocr/app/internal/http"
	"bank-transactions-ocr/app/internal/repositories"
	"bank-transactions-ocr/app/internal/services"
)

type Config struct {
	SupabaseURL string
	SupabaseKey string
	ServerAddr  string
}

// Dependencies is a collection of all application dependencies.
type Dependencies struct {
	Databases    *databases.Registry
	Repositories *repositories.Registry
	Services     *services.Registry
	Handlers     *handlers.Registry
	Server       *httpserver.Server
}

// NewDependencies wires the full dependency graph in layer order:
// databases → repositories → services → handlers → http server.
func NewDependencies(cfg Config) (*Dependencies, error) {
	var deps Dependencies
	var err error

	deps.Databases, err = databases.NewRegistry(databases.Config{
		URL: cfg.SupabaseURL,
		Key: cfg.SupabaseKey,
	})
	if err != nil {
		return nil, fmt.Errorf("creating database registry: %w", err)
	}

	deps.Repositories = repositories.NewRegistry(deps.Databases)

	deps.Services = services.NewRegistry(deps.Repositories)

	deps.Handlers, err = handlers.NewRegistry(deps.Services)
	if err != nil {
		return nil, fmt.Errorf("creating handler registry: %w", err)
	}

	deps.Server = httpserver.NewServer(cfg.ServerAddr, deps.Handlers)

	return &deps, nil
}

// Close releases all resources in reverse dependency order.
func (d *Dependencies) Close() error {
	var errs []error

	if err := d.Handlers.Close(); err != nil {
		errs = append(errs, fmt.Errorf("closing handlers: %w", err))
	}
	if err := d.Databases.Close(); err != nil {
		errs = append(errs, fmt.Errorf("closing databases: %w", err))
	}

	if len(errs) > 0 {
		return fmt.Errorf("close errors: %v", errs)
	}
	return nil
}
