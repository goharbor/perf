package report

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"path/filepath"
	"reflect"
	"strings"

	markdown "github.com/MichaelMure/go-term-markdown"
)

var mdReportTemplate = `
### Harbor Performance Testing Report


| API | Avg | Min | Med | Max | P(90) | P(95) | Success Rate | Iterations Rate |
|-----|-----|-----|-----|-----|-------|-------|--------------|-----------------|
`

// Summary is the metric summary.
type Summary struct {
	Description    string `json:"description"`
	Avg            string `json:"avg"`
	Min            string `json:"min"`
	Med            string `json:"Med"`
	Max            string `json:"Max"`
	P90            string `json:"p90"`
	P95            string `json:"p95"`
	SuccessRate    string `json:"successRate"`
	IterationsRate string `json:"iterationsRate"`
}

// MarkdownReport generates testing report with markdown format.
func MarkdownReport() error {
	summaries, err := filepath.Glob("./outputs/*.summary.json")
	if err != nil {
		return err
	}

	var md strings.Builder
	// write header
	md.WriteString(mdReportTemplate)
	for _, sum := range summaries {
		data, err := ioutil.ReadFile(sum)
		if err != nil {
			return err
		}

		var s Summary
		if err = json.Unmarshal(data, &s); err != nil {
			return err
		}

		var cols []string

		v := reflect.ValueOf(s)
		for i := 0; i < v.NumField(); i++ {
			cols = append(cols, fmt.Sprintf("%v", v.Field(i).Interface()))
		}

		md.WriteString(fmt.Sprintf("| %s |\n", strings.Join(cols, " | ")))
	}
	// print result
	fmt.Printf("\n\n")
	fmt.Println(string(markdown.Render(md.String(), 120, 10)))
	// write report
	return ioutil.WriteFile("./outputs/report.md", []byte(md.String()), 0666)
}
