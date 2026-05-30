package models

type AccountRuleException struct {
	ID        string `json:"id,omitempty"`
	UserID    string `json:"user_id"`
	AccountID string `json:"account_id"`
	RuleID    string `json:"rule_id"`
}
