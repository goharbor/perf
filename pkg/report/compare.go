package report

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"github.com/go-echarts/go-echarts/v2/charts"
	"github.com/go-echarts/go-echarts/v2/opts"
)

// Compare compares result and render plot.
func Compare(dirs ...string) error {
	// summaries for API
	apiSummaries := make(map[string][]*Summary)
	// summaries for pull/push
	pullSummaries := make(map[string][]*Summary)
	// aggregate
	aggregate := func(path string) error {
		files, err := filepath.Glob(fmt.Sprintf("%s/*.summary.json", path))
		if err != nil {
			return err
		}

		for _, f := range files {
			data, err := ioutil.ReadFile(f)
			if err != nil {
				return err
			}

			var s Summary
			if err = json.Unmarshal(data, &s); err != nil {
				return err
			}

			if strings.Contains(f, "push-artifacts") || strings.Contains(f, "pull-artifacts") {
				pullSummaries[s.Description] = append(pullSummaries[s.Description], &s)
			} else {
				apiSummaries[s.Description] = append(apiSummaries[s.Description], &s)
			}
		}

		return nil
	}

	for _, dir := range dirs {
		if err := aggregate(dir); err != nil {
			return err
		}
	}

	apiBar, err := createBar(apiSummaries, dirs...)
	if err != nil {
		return err
	}

	if err = renderAPIChart(apiBar, dirs...); err != nil {
		return err
	}

	pullBar, err := createBar(pullSummaries, dirs...)
	if err != nil {
		return err
	}

	if err = renderPullChart(pullBar, dirs...); err != nil {
		return err
	}

	return nil
}

func createBar(summaries map[string][]*Summary, dirs ...string) (*charts.Bar, error) {
	bar := charts.NewBar()
	// set x axis
	xAxis := make([]string, 0, len(summaries))
	for k := range summaries {
		xAxis = append(xAxis, k)
	}

	sort.Strings(xAxis)

	bar.SetXAxis(xAxis)

	data := make([][]opts.BarData, len(dirs))
	for _, x := range xAxis {
		for i := range dirs {
			var err error
			var p95 float64

			p95Str := summaries[x][i].P95
			if strings.HasSuffix(p95Str, "ms") {
				p95Str = strings.TrimSuffix(p95Str, "ms")
				p95, err = strconv.ParseFloat(p95Str, 64)
				if err != nil {
					return nil, err
				}

				p95, err = strconv.ParseFloat(fmt.Sprintf("%.2f", p95/1000), 64)
				if err != nil {
					return nil, err
				}
			} else if strings.HasSuffix(p95Str, "s") {
				p95Str = strings.TrimSuffix(p95Str, "s")
				p95, err = strconv.ParseFloat(p95Str, 64)
				if err != nil {
					return nil, err
				}

				p95, err = strconv.ParseFloat(fmt.Sprintf("%.2f", p95), 64)
				if err != nil {
					return nil, err
				}
			}

			data[i] = append(data[i], opts.BarData{Value: p95})
		}
	}

	for i := range dirs {
		bar.AddSeries(dirs[i], data[i]).SetSeriesOptions(
			charts.WithLabelOpts(opts.Label{
				Show:     true,
				Position: "top",
			}),
		)
	}

	return bar, nil
}

func renderAPIChart(bar *charts.Bar, dirs ...string) error {
	bar.SetGlobalOptions(
		charts.WithTitleOpts(opts.Title{
			Title:    "Harbor Performance",
			Subtitle: strings.Join(dirs, " VS. ") + "(the smaller the better)",
			Right:    "45%",
		}),
		charts.WithXAxisOpts(opts.XAxis{
			Name:      "API",
			AxisLabel: &opts.AxisLabel{Interval: "0", ShowMinLabel: true, ShowMaxLabel: true, FontSize: "8"},
		}),
		charts.WithYAxisOpts(opts.YAxis{
			Name: "P95(seconds)",
		}),
		charts.WithInitializationOpts(opts.Initialization{
			Width:  "1600px",
			Height: "800px",
		}),
		charts.WithLegendOpts(opts.Legend{Right: "80%", Data: dirs, Show: true}),
		charts.WithToolboxOpts(opts.Toolbox{Show: true}),
	)

	apiChartFile, err := os.Create("./outputs/api-comparison.html")
	if err != nil {
		return err
	}

	if err = bar.Render(apiChartFile); err != nil {
		return err
	}

	fmt.Printf("api chart was rendered in: %s\n", apiChartFile.Name())
	return nil
}

func renderPullChart(bar *charts.Bar, dirs ...string) error {
	bar.SetGlobalOptions(
		charts.WithTitleOpts(opts.Title{
			Title:    "Harbor Performance",
			Subtitle: strings.Join(dirs, " VS. ") + "(the smaller the better)",
			Right:    "45%",
		}),
		charts.WithXAxisOpts(opts.XAxis{
			Name:      "PULL/PUSH",
			AxisLabel: &opts.AxisLabel{Interval: "0", ShowMinLabel: true, ShowMaxLabel: true, FontSize: "10"},
		}),
		charts.WithYAxisOpts(opts.YAxis{
			Name: "P95(seconds)",
		}),
		charts.WithInitializationOpts(opts.Initialization{
			Width:  "1600px",
			Height: "800px",
		}),
		charts.WithLegendOpts(opts.Legend{Right: "80%", Data: dirs, Show: true}),
		charts.WithToolboxOpts(opts.Toolbox{Show: true}),
	)

	f, err := os.Create("./outputs/pull-push-comparison.html")
	if err != nil {
		return err
	}

	if err = bar.Render(f); err != nil {
		return err
	}

	fmt.Printf("pull/push chart was rendered in: %s\n", f.Name())
	return nil
}
