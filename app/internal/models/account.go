package models

type Account struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	BankName      string `json:"bank_name"`
	Currency      string `json:"currency"`
	AccountNumber string `json:"account_number"`
	ShortNumber   string `json:"short_number"`
}
