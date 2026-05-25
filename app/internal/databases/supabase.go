package databases

import (
	"net/http"
	"time"
)

type SupabaseClient struct {
	BaseURL    string
	APIKey     string // service role key — bypasses RLS, used by CLI
	AnonKey    string // anon key — used with user JWTs so RLS applies
	HTTPClient *http.Client
}

func NewSupabaseClient(baseURL, apiKey, anonKey string) *SupabaseClient {
	return &SupabaseClient{
		BaseURL:    baseURL,
		APIKey:     apiKey,
		AnonKey:    anonKey,
		HTTPClient: &http.Client{Timeout: 30 * time.Second},
	}
}
