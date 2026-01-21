FROM golang:1.21-alpine

LABEL maintainer="perf" \
      description="Harbor performance test runner (Alauda Devops fork)"

# 一些基础工具：git 用于 clone xk6-harbor，bash/ca-certificates 方便调试和 TLS
RUN apk add --no-cache \
    git \
    bash \
    ca-certificates \
    curl \
    tzdata

WORKDIR /app

# 先只拷贝 go.mod/go.sum，加快依赖下载缓存
COPY go.mod go.sum ./
RUN go mod download

# 再拷贝剩余代码
COPY . .

# 创建 outputs 目录，避免首次运行时缺目录
RUN mkdir -p ./outputs

# 默认工作目录
WORKDIR /app

# 暴露一个可选的入口：通过环境变量或覆盖 CMD 选择 mage 目标
# 例：
#   docker run --rm \
#     -e HARBOR_URL=https://admin:password@harbor.domain \
#     -e HARBOR_SIZE=small \
#     perf:latest \
#     go run mage.go prepare
#
#   docker run --rm \
#     -e HARBOR_URL=https://admin:password@harbor.domain \
#     -e HARBOR_VUS=100 \
#     -e HARBOR_ITERATIONS=200 \
#     perf:latest
#
# 默认执行 all（等价于 `go run mage.go`）
CMD ["go", "run", "mage.go"]

