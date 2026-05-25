package handlers

import (
	"encoding/json"
	"net/http"
)

func NewAccountHandler(svc AccountLister) *AccountHandler {
	return &AccountHandler{svc: svc}
}

func (h *AccountHandler) List(w http.ResponseWriter, r *http.Request) {
	accounts, err := h.svc.List(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(accounts); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
}
