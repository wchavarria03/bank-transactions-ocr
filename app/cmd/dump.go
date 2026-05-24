package cmd

import "github.com/spf13/cobra"

var dumpCmd = &cobra.Command{
	Use:   "dump",
	Short: "Dump raw extracted text from PDFs (for debugging parsers)",
	RunE: func(cmd *cobra.Command, args []string) error {
		return app.DumpHandler.Handle(cfg.InputDir, cfg.OutputDir, cfg.Verbose)
	},
}

func init() {
	rootCmd.AddCommand(dumpCmd)
}
