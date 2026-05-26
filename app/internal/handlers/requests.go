package handlers

type createAccountRequest struct {
	Name          string `json:"name" binding:"required"`
	BankName      string `json:"bank_name" binding:"required"`
	Currency      string `json:"currency" binding:"required"`
	AccountNumber string `json:"account_number"`
}

type updateAccountRequest struct {
	Name     string `json:"name"`
	Currency string `json:"currency"`
}
