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

## The environment variables  and targets

The environment variables in the table are the configurations for the performance testing. Use `VAR1=value1 VAR2=value2 go run mage.go target` format to apply the variables to the testing

| Variable                   | Description                                                  | Default value                                 |
| -------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| HARBOR_URL                 | The url of the harbor will be tested, its format is https?://username:password@harbor.domain |               |
| HARBOR_SIZE                | The user data size to prepare for the tests                  | small                                         |
| HARBOR_VUS                 | The number of virtual users for the performance test         | 500                                           |
| HARBOR_ITERATIONS          | The script total iteration limit (among all VUs) for the performance test | 1000                             |
| K6_ALWAYS_UPDATE           | Always install the latest xk6-harbor                         | false                                         |
| K6_QUIET                   | Disable progress updates of the xk6-harbor                   | false                                         |


The following table includes the targets.

| Target  | Description                                    | Example                                                                                  |
| ------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| prepare | Generate user data                             | HARBOR_SIZE=small HARBOR_URL=https://admin:password@harbor.domain go run mage.go prepare |
| run     | Execute a specific test                        | HARBOR_URL=https://admin:password@harbor.domain go run mage.go list-projects             |
| all     | Execute all tasks                              | HARBOR_URL=https://admin:password@harbor.domain go run mage.go all                       |
| list    | Print all test                                 | go run mage.go list                                                                      |
