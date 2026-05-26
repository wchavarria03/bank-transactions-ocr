package models

type Category struct {
	ID       string      `json:"id,omitempty"`
	Name     string      `json:"name"`
	ParentID string      `json:"parent_id,omitempty"`
	UserID   string      `json:"user_id,omitempty"`
	Color    string      `json:"color,omitempty"`
	Children []*Category `json:"children,omitempty"`
}

type CategoryRule struct {
	ID         string `json:"id,omitempty"`
	UserID     string `json:"user_id,omitempty"`
	AccountID  string `json:"account_id,omitempty"`
	Pattern    string `json:"pattern"`
	CategoryID string `json:"category_id"`
	Priority   int    `json:"priority"`
}
