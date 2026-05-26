package models

type ReportSummary struct {
	TotalBalance   float64         `json:"total_balance"`
	PeriodChange   float64         `json:"period_change"`
	TotalIncome    float64         `json:"total_income"`
	TotalExpenses  float64         `json:"total_expenses"`
	BalanceHistory []DailyBalance  `json:"balance_history"`
	DailyChanges   []DailyChange   `json:"daily_changes"`
	ByCategory     []CategorySpend `json:"by_category"`
	Transfers      TransferSummary `json:"transfers"`
	PeriodStart    string          `json:"period_start"`
	PeriodEnd      string          `json:"period_end"`
}

type DailyBalance struct {
	Date    string  `json:"date"`
	Balance float64 `json:"balance"`
}

type DailyChange struct {
	Date     string  `json:"date"`
	Income   float64 `json:"income"`
	Expenses float64 `json:"expenses"`
}

type CategorySpend struct {
	CategoryID   string  `json:"category_id"`
	CategoryName string  `json:"category_name"`
	Color        string  `json:"color"`
	Total        float64 `json:"total"`
}

type TransferSummary struct {
	IncomingCount int     `json:"incoming_count"`
	IncomingTotal float64 `json:"incoming_total"`
	OutgoingCount int     `json:"outgoing_count"`
	OutgoingTotal float64 `json:"outgoing_total"`
}
