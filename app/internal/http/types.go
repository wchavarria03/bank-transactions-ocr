// Package httpserver provides HTTP server routing configuration.
//
//nolint:revive // Package name httpserver is intentional for internal HTTP routing.
package httpserver

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Router struct {
	engine *gin.Engine
}

type Server struct {
	httpServer *http.Server
}
