// Package httpserver provides HTTP server routing configuration.
//
//nolint:revive // Package name httpserver is intentional for internal HTTP routing.
package httpserver

import "net/http"

type Router struct {
	mux *http.ServeMux
}

type Server struct {
	httpServer *http.Server
}
