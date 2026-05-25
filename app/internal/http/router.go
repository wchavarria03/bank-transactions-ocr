package httpserver

import (
	"github.com/gin-gonic/gin"

	"bank-transactions-ocr/app/internal/handlers"
)

// NewRouter creates a new Router with all routes configured.
func NewRouter(hdlrs *handlers.Registry) *Router {
	engine := gin.New()
	engine.Use(gin.Recovery())
	engine.Use(gin.Logger())

	setupRoutes(engine, hdlrs)

	return &Router{engine: engine}
}

// setupRoutes configures all versioned routes for the application.
func setupRoutes(engine *gin.Engine, hdlrs *handlers.Registry) {
	v1 := engine.Group("/v1")
	setupAccountRoutes(v1, hdlrs)
}

// setupAccountRoutes configures account-related routes.
func setupAccountRoutes(rg *gin.RouterGroup, hdlrs *handlers.Registry) {
	accounts := rg.Group("/accounts")
	accounts.GET("", hdlrs.Account.List)
}
