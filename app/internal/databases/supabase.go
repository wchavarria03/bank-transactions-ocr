package databases

import (
	"net/http"
	"time"
)

type SupabaseClient struct {
	BaseURL    string
	APIKey     string
	HTTPClient *http.Client
}

func NewSupabaseClient(baseURL, apiKey string) *SupabaseClient {
	return &SupabaseClient{
		BaseURL:    baseURL,
		APIKey:     apiKey,
		HTTPClient: &http.Client{Timeout: 30 * time.Second},
	}
}
