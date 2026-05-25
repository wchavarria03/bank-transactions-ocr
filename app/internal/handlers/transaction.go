package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func NewTransactionHandler(svc TransactionLister) *TransactionHandler {
	return &TransactionHandler{svc: svc}
}

func (h *TransactionHandler) ListByAccount(c *gin.Context) {
	accountID := c.Param("id")
	txs, err := h.svc.ListByAccount(c.Request.Context(), accountID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, txs)
}
