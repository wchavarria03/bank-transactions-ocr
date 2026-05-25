package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func NewAccountHandler(svc AccountLister) *AccountHandler {
	return &AccountHandler{svc: svc}
}

func (h *AccountHandler) List(c *gin.Context) {
	accounts, err := h.svc.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, accounts)
}
