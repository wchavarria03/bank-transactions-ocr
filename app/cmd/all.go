package cmd

import (
	"context"

	"github.com/spf13/cobra"
)

var allCmd = &cobra.Command{
	Use:     "all",
	Aliases: []string{"a", "process"},
	Short:   "Run the complete transaction processing workflow",
	RunE: func(cmd *cobra.Command, args []string) error {
		return deps.Handlers.Extract.Handle(
			context.Background(),
			cfg.InputDir,
			cfg.OutputDir,
			cfg.DryRun,
			cfg.Verbose,
		)
	},
}

func init() {
	rootCmd.AddCommand(allCmd)
}
