package cmd

import (
	"context"

	"github.com/spf13/cobra"
)

var extractCmd = &cobra.Command{
	Use:   "extract",
	Short: "Extract transactions from PDFs and import to Supabase (use --dry-run to write files instead)",
	RunE: func(cmd *cobra.Command, args []string) error {
		return app.ExtractHandler.Handle(
			context.Background(),
			cfg.InputDir,
			cfg.OutputDir,
			cfg.DryRun,
			cfg.Verbose,
		)
	},
}

func init() {
	rootCmd.AddCommand(extractCmd)
}
