// Package cmd provides the CLI for the transactions processor.
package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var allCmd = &cobra.Command{
	Use:     "all",
	Aliases: []string{"a", "process"},
	Short:   "Run the complete transaction processing workflow",
	Long: `Run the complete transaction processing workflow in sequence.
This command will first extract transaction data from documents.
`,
	Example: `  # Run complete workflow with default settings
  transactions-processor all

  # Run workflow with verbose output
  transactions-processor -v all

  # Run workflow with custom directories
  transactions-processor -i custom-input -o custom-output all`,
	RunE: func(cmd *cobra.Command, args []string) error {
		if config.Verbose {
			fmt.Println("Running complete transaction processing workflow...")
		}

		// Run extract command
		if err := extractCmd.RunE(cmd, args); err != nil {
			return fmt.Errorf("extract command failed: %w", err)
		}

		if config.Verbose {
			fmt.Println("Successfully completed transaction processing workflow")
		}
		return nil
	},
}

func init() {
	rootCmd.AddCommand(allCmd)
}
