# perf

This repository includes scripts for the performance test of harbor.


If you see performance problems please open an issue in repo:
[goharbor/harbor](https://github.com/goharbor/harbor)


## How to run the performance tests

To run performance tests for the target harbor instance, first ensure you have the prerequisites:

- [Go toolchain](https://go101.org/article/go-toolchain.html)
- Git

Then:

1. Clone this repostiroy and generate client from swagger
  ```shell
  git clone https://github.com/goharbor/perf
  cd perf
  ```

2. Prepare user data
  ```shell
  export HARBOR_URL=https://admin:password@harbor.domain
  export HARBOR_SIZE=small
  go run mage.go prepare
  ```

3. Run all tests
  ```shell
  export HARBOR_URL=https://admin:password@harbor.domain
  export HARBOR_VUS=100
  export HARBOR_ITERATIONS=200
  go run mage.go
  ```

## The environment variables and targets

The environment variables in the table are the configurations for the performance testing. Use `VAR1=value1 VAR2=value2 go run mage.go target` format to apply the variables to the testing

| Variable          | Description                                                  | Default value |
| ----------------- | ------------------------------------------------------------ | ------------- |
| HARBOR_URL        | The url of the harbor will be tested, its format is https?://username:password@harbor.domain |               |
| HARBOR_SIZE       | The user data size to prepare for the tests                  | small         |
| HARBOR_VUS        | The number of virtual users for the performance test         | 500           |
| HARBOR_ITERATIONS | The script total iteration limit (among all VUs) for the performance test | 1000          |
| K6_ALWAYS_UPDATE  | Always install the latest xk6-harbor                         | false         |
| K6_QUIET          | Disable progress updates of the k6                           | false         |
| K6_CSV_OUTPUT     | Make k6 output detailed statistics in a CSV format           | false         |
| K6_JSON_OUTPUT    | Make k6 output detailed statistics in JSON format            | false         |
| HARBOR_REPORT     | Whether generate testing report                              | false         |

**Experimental** to send the metrics to the prometheus. (Refer to <https://k6.io/docs/results-output/real-time/prometheus-remote-write> for more details)
| Variable          | Description                                                  | Default value |
| ----------------- | ------------------------------------------------------------ | ------------- |
| K6_PROMETHEUS_RW_SERVER_URL | URL of the Prometheus remote write implementation's endpoint |     |
| K6_PROMETHEUS_RW_USERNAME | User for the HTTP Basic authentication at the Prometheus remote write endpoint | |
| K6_PROMETHEUS_RW_PASSWORD |  Password for the HTTP Basic authentication at the Prometheus remote write endpoint| |
| K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM | If true, it maps the all defined trend metrics as Native Histograms | false |
| K6_PROMETHEUS_RW_TREND_STATS | It's a comma-separated list of stats functions | min,p(90),p(95),p(99),max |
| K6_PROMETHEUS_RW_INSECURE_SKIP_TLS_VERIFY | If true, the HTTP client skips TLS verification on the endpoint | false |


The following table includes the targets.

| Target  | Description                                    | Example                                                                                  |
| ------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| prepare | Generate user data                             | HARBOR_SIZE=small HARBOR_URL=https://admin:password@harbor.domain go run mage.go prepare |
| run     | Execute a specific test                        | HARBOR_URL=https://admin:password@harbor.domain go run mage.go run list-projects         |
| all     | Execute all tasks                              | HARBOR_URL=https://admin:password@harbor.domain go run mage.go all                       |
| list    | Print all test                                 | go run mage.go list                                                                      |
| compare | Compare performance                            | go run mage.go compare 251 252                                                           |

## Performance comparison

Compare the performance of harbor different versions, the format of HTML
comparison bar can be generated easily by subcommand. Before you need to retain
the outputs folder every time and then rename them to a meaningful name.

For example, if we want to compare the performance of harbor 2.5.1 and 2.5.2, we
can just follow the steps:

1. Deploy harbor 2.5.1, prepare data and run tests
  ```shell
    export HARBOR_URL=https://admin:password@harbor.domain
    export HARBOR_SIZE=small
    # prepare data
    go run mage.go prepare
    # run tests
    go run mage.go
    # retain the outputs result
    mv outputs 251 && mkdir outputs
  ```

2. Deploy harbor 2.5.2, prepare data and run tests

  ```shell
    export HARBOR_URL=https://admin:password@harbor.domain
    export HARBOR_SIZE=small
    # prepare data
    go run mage.go prepare
    # run tests
    go run mage.go
    # retain the outputs result
    mv outputs 252 && mkdir outputs
  ```

3. Compare
  ```shell
   # use outputs result folder name as parameters
   go run mage.go compare 251 252
   # then you can see the comparison in the browser
   open ./outputs/api-comparison.html
   open ./outputs/pull-push-comparison.html
  ```
