// +build mage

package main

import (
	"fmt"
	"io/ioutil"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/carolynvs/magex/mgx"
	"github.com/carolynvs/magex/pkg"
	"github.com/carolynvs/magex/shx"
	"github.com/goharbor/perf/pkg/report"
	"github.com/magefile/mage/mg"
	"github.com/magefile/mage/sh"
	"github.com/pkg/errors"
)

const (
	HarborSizeEnvKey       = "HARBOR_SIZE"
	HarborURLEnvKey        = "HARBOR_URL"
	HarborVusEnvKey        = "HARBOR_VUS"
	HarborIterationsEnvKey = "HARBOR_ITERATIONS"
	HarborReport           = "HARBOR_REPORT"

	K6QuietEnvKey        = "K6_QUIET"
	K6AlwaysUpdateEnvKey = "K6_ALWAYS_UPDATE"

	K6CsvOutputEnvKey  = "K6_CSV_OUTPUT"
	K6JsonOutputEnvKey = "K6_JSON_OUTPUT"
)

// Default target to run when none is specified
// If not set, running mage will list available targets
var Default = All

// Install Mage if necessary
func EnsureMage() error {
	return pkg.EnsureMage("v1.11.0")
}

// Install K6 with harbor extension if necessary
func EnsureK6() error {
	return ensureK6(getEnvBool(K6AlwaysUpdateEnvKey))
}

func mkOutputDir() error {
	return os.MkdirAll("./outputs", 0755)
}

// Generate user data
func Prepare() error {
	mg.Deps(EnsureK6, mkOutputDir)

	env := addHarborSizeToEnv(addHarborEnv(nil))

	scripts, err := filepath.Glob("./scripts/data/*.js")
	if err != nil {
		return err
	}

	for _, script := range scripts {
		args := getK6RunArgs(script)

		if err := sh.RunWithV(env, "k6", args...); err != nil {
			return err
		}
	}

	return nil
}

// Execute a specific test
func Run(test string) error {
	mg.Deps(EnsureK6, mkOutputDir)

	scripts, err := filepath.Glob(fmt.Sprintf("./scripts/test/%s.js", test))
	mgx.Must(err)

	if len(scripts) == 0 {
		mgx.Must(fmt.Errorf("test \"%s\" not found", test))
	}

	env := addHarborEnv(nil)

	args := addVusAndIterationsArgs(getK6RunArgs(scripts[0]))

	if err := sh.RunWithV(env, "k6", args...); err != nil {
		return err
	}

	return nil
}

// Execute all tests
func All() error {
	mg.Deps(EnsureK6, mkOutputDir)

	env := addHarborEnv(nil)

	scripts, err := filepath.Glob("./scripts/test/*.js")
	if err != nil {
		return err
	}

	for _, script := range scripts {
		args := addVusAndIterationsArgs(getK6RunArgs(script))

		if err := sh.RunWithV(env, "k6", args...); err != nil {
			return err
		}
	}

	if getEnvBool(HarborReport) {
		return report.MarkdownReport()
	}

	return nil
}

// Print all tests
func List() error {
	scripts, err := filepath.Glob("./scripts/test/*.js")
	if err != nil {
		return err
	}

	for _, script := range scripts {
		content, err := ioutil.ReadFile(script)
		if err != nil {
			return err
		}
		lines := strings.Split(string(content), "\n")

		file := filepath.Base(script)
		name := strings.TrimSuffix(file, filepath.Ext(file))

		fmt.Printf("%-40s %s\n", name, strings.Trim(lines[0], "// "))
	}

	return nil
}

func ensureK6(force bool) error {
	cmd := "k6"

	found, err := pkg.IsCommandAvailable(cmd, "")
	if err != nil {
		return err
	}

	if !found || force {
		return installK6()
	}

	return nil
}

func installK6() error {
	cmd := "k6"

	pkg.EnsureGopathBin()

	fmt.Printf("Installing %s\n", cmd)

	tmp, err := ioutil.TempDir("", "k6")
	if err != nil {
		return errors.Wrap(err, "could not create a temp directory to install mage")
	}
	defer os.RemoveAll(tmp)

	repoUrl := "https://github.com/heww/xk6-harbor.git"
	err = shx.Command("git", "clone", repoUrl).CollapseArgs().In(tmp).RunE()
	if err != nil {
		return errors.Wrapf(err, "could not clone %s", repoUrl)
	}

	repoPath := filepath.Join(tmp, "xk6-harbor")

	commit, err := shx.Command("git", "rev-parse", "--short", "HEAD").In(repoPath).OutputE()
	if err != nil {
		return errors.Wrap(err, "cound not get git commit")
	}

	path := filepath.Join(pkg.GetGopathBin(), cmd)

	ldflags := fmt.Sprintf(`-extldflags -static -X "github.com/loadimpact/k6/lib/consts.VersionDetails=%s"`, commit)

	err = shx.Command("go", "build", "-ldflags="+ldflags, "-o", path, "./cmd/k6/main.go").Env("CGO_ENABLED=0").In(repoPath).RunE()
	if err != nil {
		return errors.Wrap(err, "could not build k6")
	}

	return nil
}

func addHarborEnv(env map[string]string) map[string]string {
	harborURL := os.Getenv(HarborURLEnvKey)
	if harborURL == "" {
		mgx.Must(fmt.Errorf("env %s required", HarborURLEnvKey))
	}

	u, err := url.Parse(harborURL)
	mgx.Must(err)

	if env == nil {
		env = map[string]string{}
	}

	env["HARBOR_SCHEME"] = u.Scheme
	env["HARBOR_HOST"] = u.Host

	if u.User != nil {
		env["HARBOR_USERNAME"] = u.User.Username()
		env["HARBOR_PASSWORD"], _ = u.User.Password()
	}

	return env
}

func addHarborSizeToEnv(env map[string]string) map[string]string {
	if env == nil {
		env = map[string]string{}
	}

	size := os.Getenv(HarborSizeEnvKey)

	switch size {
	case "ci", "small":
		env[HarborSizeEnvKey] = size
	case "":
		mgx.Must(fmt.Errorf("env %s required", HarborSizeEnvKey))
	default:
		mgx.Must(fmt.Errorf("unknow user data size \"%s\", it must be in (ci, small)", size))
	}

	return env
}

func getK6RunArgs(script string) []string {
	args := []string{"run", script, "--no-usage-report"}

	if getEnvBool(K6QuietEnvKey) {
		args = append(args, "--quiet")
	}

	hasOutputs := false
	scriptName := getScriptName(script)

	if getEnvBool(K6CsvOutputEnvKey) {
		hasOutputs = true
		args = append(args, "--out", fmt.Sprintf("csv=./outputs/%s.csv", scriptName))
	}

	if getEnvBool(K6JsonOutputEnvKey) {
		hasOutputs = true
		args = append(args, "--out", fmt.Sprintf("json=./outputs/%s.json", scriptName))
	}

	if hasOutputs {
		args = append(args, "--tag", fmt.Sprintf("script=%s", scriptName))
	}

	return args
}

func addVusAndIterationsArgs(args []string) []string {
	vus, err := getEnvInt64(HarborVusEnvKey)
	mgx.Must(err)

	iterations, err := getEnvInt64(HarborIterationsEnvKey)
	mgx.Must(err)

	if vus > 0 && iterations == 0 {
		iterations = vus * 2
	}

	if vus > iterations {
		mgx.Must(fmt.Errorf("the value of the %s must be less or equal with the value of %s", HarborVusEnvKey, HarborIterationsEnvKey))
	}

	if vus > 0 {
		args = append(args, "--vus", strconv.FormatInt(vus, 10))
	}

	if iterations > 0 {
		args = append(args, "--iterations", strconv.FormatInt(iterations, 10))
	}

	return args
}

func getEnvBool(key string) bool {
	switch strings.ToLower(os.Getenv(key)) {
	case "true", "t", "yes", "y":
		return true
	default:
		return false
	}
}

func getEnvInt64(key string) (int64, error) {
	str := os.Getenv(key)
	if str == "" {
		return 0, nil
	}

	return strconv.ParseInt(str, 10, 64)
}

func getScriptName(script string) string {
	file := filepath.Base(script)

	return strings.TrimSuffix(file, filepath.Ext(file))
}
