package handlers

import (
	"math"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"ledger-api/app/internal/models"
)

func NewTransactionHandler(svc TransactionLister) *TransactionHandler {
	return &TransactionHandler{svc: svc}
}

func (h *TransactionHandler) ListByAccount(c *gin.Context) {
	accountID := c.Param("id")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	filter := models.TxFilter{
		Search: c.Query("search"),
		Type:   c.Query("type"),
		From:   c.Query("from"),
		To:     c.Query("to"),
		Page:   page,
		Limit:  limit,
	}

	txs, total, err := h.svc.ListFiltered(c.Request.Context(), accountID, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	c.JSON(http.StatusOK, models.TxPage{
		Transactions: txs,
		Total:        total,
		Page:         page,
		Limit:        limit,
		TotalPages:   totalPages,
	})
}
