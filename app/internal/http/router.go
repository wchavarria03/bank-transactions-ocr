package httpserver

import (
	"net/http"

	"bank-transactions-ocr/app/internal/handlers"
)

// NewRouter creates a new Router with all routes configured.
func NewRouter(hdlrs *handlers.Registry) *Router {
	mux := http.NewServeMux()
	r := &Router{mux: mux}

	setupRoutes(mux, hdlrs)

	return r
}

// setupRoutes configures all versioned routes for the application.
func setupRoutes(mux *http.ServeMux, hdlrs *handlers.Registry) {
	setupAccountRoutes(mux, hdlrs)
}

// setupAccountRoutes configures account-related routes.
func setupAccountRoutes(mux *http.ServeMux, hdlrs *handlers.Registry) {
	mux.HandleFunc("GET /v1/accounts", hdlrs.Account.List)
}
