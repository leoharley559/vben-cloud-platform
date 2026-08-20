#!/bin/bash

# 一键升版 + 按环境打包上传
# 用法:
#   ./release.sh              # 生产（默认）
#   ./release.sh prod
#   ./release.sh test         # 测试服（先填 .env.test 和 deploy/test.env）
#   ./release.sh test --no-bump

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BUMP=true
DEPLOY_ENV="prod"

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

normalize_env_name() {
    case "$1" in
        prod|production) echo "prod" ;;
        test) echo "test" ;;
        *)
            log_error "未知环境: $1（仅支持 prod / test）"
            ;;
    esac
}

vite_mode_for_env() {
    case "$1" in
        prod) echo "production" ;;
        test) echo "test" ;;
        *)
            log_error "未知环境: $1"
            ;;
    esac
}

for arg in "$@"; do
    case "$arg" in
        --no-bump)
            BUMP=false
            ;;
        -h|--help)
            echo "用法: $0 [prod|test] [--no-bump]"
            echo "  prod  生产（默认）  pnpm release"
            echo "  test  测试          pnpm release:test"
            echo "  每次发布版本号末位 +1，满 100 进位（1.0.100 → 1.1.0）"
            echo "  --no-bump  使用当前版本重新打包上传"
            exit 0
            ;;
        --*)
            log_error "未知参数: ${arg}"
            ;;
        *)
            DEPLOY_ENV="$(normalize_env_name "$arg")"
            ;;
    esac
done

VITE_MODE="$(vite_mode_for_env "${DEPLOY_ENV}")"
ENV_FILE="${SCRIPT_DIR}/.env.${VITE_MODE}"
TARGET_FILE="${SCRIPT_DIR}/deploy/${DEPLOY_ENV}.env"

if [ ! -f "${ENV_FILE}" ]; then
    log_error "未找到前端环境配置: ${ENV_FILE}"
fi
if [ ! -f "${TARGET_FILE}" ]; then
    log_error "未找到发布目标配置: ${TARGET_FILE}"
fi

# 升版本前先校验发布目标，避免测服没配就把版本号加了
REMOTE_HOST=""
SITE_URL=""
REMOTE_DIR=""
# shellcheck disable=SC1090
source "${TARGET_FILE}"
if [ -z "${REMOTE_HOST:-}" ] || [ -z "${SITE_URL:-}" ] || [ -z "${REMOTE_DIR:-}" ]; then
    log_error "环境 ${DEPLOY_ENV} 的发布目标未配齐。
请填写 ${TARGET_FILE} 中的 REMOTE_HOST / REMOTE_DIR / SITE_URL。
测试服前端接口改 ${ENV_FILE}。"
fi

cd "${REPO_ROOT}"

log_info "发布环境: ${DEPLOY_ENV}（Vite mode=${VITE_MODE}）→ ${SITE_URL}"

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

log_info "开始构建..."
if [ "${DEPLOY_ENV}" = "test" ]; then
    pnpm -F @vben/web-antd run build:test
else
    pnpm build:antd
fi

if [ ! -f "${SCRIPT_DIR}/dist/index.html" ]; then
    log_error "构建失败：未找到 ${SCRIPT_DIR}/dist/index.html"
fi

log_info "开始上传 v${VERSION} ..."
bash "${SCRIPT_DIR}/upload.sh" -y --from-dist --env "${DEPLOY_ENV}"

log_success "发布完成: ${DEPLOY_ENV} v${VERSION}"
log_info "登录页: ${SITE_URL}/#/auth/login"
