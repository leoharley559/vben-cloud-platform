#!/bin/bash

# 一键升版 + 打包 + 发布到 https://ccccc-web.dk888.link/
# 用法:
#   ./release.sh           # 版本号 +1 后构建并上传
#   ./release.sh --no-bump # 使用当前版本号构建并上传（发布失败重试）

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BUMP=true

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${YELLOW}[INFO] $1${NC}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

for arg in "$@"; do
    case "$arg" in
        --no-bump)
            BUMP=false
            ;;
        -h|--help)
            echo "用法: $0 [--no-bump]"
            echo "  默认每次发布将版本号末位 +1；某一段超过 100 则进位"
            echo "  例如 1.0.99 → 1.0.100，1.0.100 → 1.1.0，1.100.100 → 2.0.0"
            echo "  --no-bump  使用当前版本重新打包上传"
            exit 0
            ;;
        *)
            log_error "未知参数: ${arg}"
            ;;
    esac
done

cd "${REPO_ROOT}"

if [ "${BUMP}" = true ]; then
    VERSION="$(node "${SCRIPT_DIR}/scripts/bump-version.mjs")"
    log_info "版本号已更新: v${VERSION}"
else
    VERSION="$(node "${SCRIPT_DIR}/scripts/bump-version.mjs" --print)"
    log_info "使用当前版本号: v${VERSION}"
fi

if [ -z "${VERSION}" ]; then
    log_error "无法读取版本号"
fi

log_info "开始生产构建..."
pnpm build:antd

if [ ! -f "${SCRIPT_DIR}/dist/index.html" ]; then
    log_error "构建失败：未找到 ${SCRIPT_DIR}/dist/index.html"
fi

log_info "开始上传 v${VERSION} ..."
bash "${SCRIPT_DIR}/upload.sh" -y --from-dist

log_success "发布完成: v${VERSION}"
log_info "登录页: https://ccccc-web.dk888.link/#/auth/login"
