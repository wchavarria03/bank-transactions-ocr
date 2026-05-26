package httpserver

import (
	"github.com/gin-gonic/gin"

	"ledger-api/app/internal/handlers"
	"ledger-api/app/internal/http/middleware"
)

// NewRouter creates a new Router with all routes configured.
func NewRouter(hdlrs *handlers.Registry, jwtSecret, jwksURL string, allowedOrigins []string) *Router {
	engine := gin.New()
	engine.Use(gin.Recovery())
	engine.Use(gin.Logger())
	engine.Use(middleware.CORS(allowedOrigins))

	setupRoutes(engine, hdlrs, jwtSecret, jwksURL)

	return &Router{engine: engine}
}

// setupRoutes configures all versioned routes for the application.
func setupRoutes(engine *gin.Engine, hdlrs *handlers.Registry, jwtSecret, jwksURL string) {
	v1 := engine.Group("/v1")
	v1.Use(middleware.Auth(jwtSecret, jwksURL))

	v1.GET("/me", hdlrs.Me.GetMe)
	setupAccountRoutes(v1, hdlrs)
}

// setupAccountRoutes configures account-related routes.
func setupAccountRoutes(rg *gin.RouterGroup, hdlrs *handlers.Registry) {
	accounts := rg.Group("/accounts")
	accounts.GET("", hdlrs.Account.List)
	accounts.GET("/:id", hdlrs.Account.Get)
	accounts.GET("/:id/transactions", hdlrs.Transaction.ListByAccount)
}
