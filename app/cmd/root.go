package cmd

import (
	"fmt"
	"os"

	"ledger-api/app/internal/core"
	"github.com/spf13/cobra"
)

type cliConfig struct {
	Verbose     bool
	OutputDir   string
	InputDir    string
	DryRun      bool
	SupabaseURL string
	SupabaseKey string
	ServerAddr  string
}

var (
	cfg  = &cliConfig{}
	deps *core.Dependencies
)

var rootCmd = &cobra.Command{
	Use:   "ledger-api",
	Short: "Ingest bank statement PDFs, store transactions, and serve them via HTTP API",
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		if _, err := os.Stat(cfg.InputDir); os.IsNotExist(err) {
			return fmt.Errorf("input directory does not exist: %s", cfg.InputDir)
		}
		if err := os.MkdirAll(cfg.OutputDir, 0750); err != nil {
			return fmt.Errorf("failed to create output directory: %w", err)
		}

		var err error
		deps, err = core.NewDependencies(core.Config{
			SupabaseURL: cfg.SupabaseURL,
			SupabaseKey: cfg.SupabaseKey,
			ServerAddr:  cfg.ServerAddr,
		})
		if err != nil {
			return fmt.Errorf("initialising dependencies: %w", err)
		}
		return nil
	},
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func init() {
	rootCmd.PersistentFlags().BoolVarP(&cfg.Verbose, "verbose", "v", false, "Enable verbose output")
	rootCmd.PersistentFlags().StringVarP(&cfg.OutputDir, "output", "o", "data/output", "Output directory")
	rootCmd.PersistentFlags().StringVarP(&cfg.InputDir, "input-dir", "i", "data/input", "Input PDF directory")
	rootCmd.PersistentFlags().BoolVar(&cfg.DryRun, "dry-run", false, "Write to files instead of Supabase")
	rootCmd.PersistentFlags().StringVar(&cfg.SupabaseURL, "supabase-url", os.Getenv("SUPABASE_URL"), "Supabase project URL")
	rootCmd.PersistentFlags().StringVar(&cfg.SupabaseKey, "supabase-key", os.Getenv("SUPABASE_KEY"), "Supabase API key")
	rootCmd.PersistentFlags().StringVar(&cfg.ServerAddr, "addr", ":8080", "HTTP server listen address")
}
