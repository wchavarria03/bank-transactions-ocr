package databases

type Config struct {
	URL string
	Key string
}

type Registry struct {
	Supabase *SupabaseClient
}

func NewRegistry(cfg Config) (*Registry, error) {
	return &Registry{
		Supabase: NewSupabaseClient(cfg.URL, cfg.Key),
	}, nil
}

func (r *Registry) Close() error {
	return nil
}
