package httpserver

import (
	"context"
	"net/http"
	"time"

	"bank-transactions-ocr/app/internal/handlers"
)

// NewServer creates an HTTP server bound to addr using routes from the handler registry.
func NewServer(addr string, hdlrs *handlers.Registry) *Server {
	router := NewRouter(hdlrs)

	return &Server{
		httpServer: &http.Server{
			Addr:         addr,
			Handler:      router.mux,
			ReadTimeout:  15 * time.Second,
			WriteTimeout: 15 * time.Second,
			IdleTimeout:  60 * time.Second,
		},
	}
}

func (s *Server) Start() error {
	return s.httpServer.ListenAndServe()
}

func (s *Server) Stop(ctx context.Context) error {
	return s.httpServer.Shutdown(ctx)
}
