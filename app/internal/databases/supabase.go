package databases

import "net/http"

type SupabaseClient struct {
	BaseURL    string
	APIKey     string
	HTTPClient *http.Client
}

func NewSupabaseClient(baseURL, apiKey string) *SupabaseClient {
	return &SupabaseClient{
		BaseURL:    baseURL,
		APIKey:     apiKey,
		HTTPClient: &http.Client{},
	}
}
