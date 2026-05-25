package databases

type Config struct {
	URL     string
	Key     string
	AnonKey string
}

type Registry struct {
	Supabase *SupabaseClient
}

func NewRegistry(cfg Config) (*Registry, error) {
	return &Registry{
		Supabase: NewSupabaseClient(cfg.URL, cfg.Key, cfg.AnonKey),
	}, nil
}

func (r *Registry) Close() error {
	return nil
}
