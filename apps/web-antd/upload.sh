#!/bin/bash

# 发布 web-antd 生产包到 https://ccccc-web.dk888.link/
# 用法:
#   ./upload.sh                  # 自动找 dist.zip 或 dist/
#   ./upload.sh dist.zip         # 指定 zip
#   ./upload.sh -y               # 跳过确认（CI / 非交互）
#   ./upload.sh -y --from-dist   # 强制用当前 dist 重新打包（忽略旧 dist.zip）
#   SSH_KEY=/path/to.pem ./upload.sh

set -euo pipefail

# ================= 配置区域 =================
REMOTE_HOST="18.139.83.204"
REMOTE_USER="root"
REMOTE_DIR="/var/www/html/cloud"
SITE_URL="https://ccccc-web.dk888.link"
LOGIN_URL="${SITE_URL}/#/auth/login"
SSH_KEY_NAME="big_shot_entertainment.pem"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="${SCRIPT_DIR}/dist"
DIST_ZIP="${SCRIPT_DIR}/dist.zip"
DEFAULT_SSH_KEY="${SCRIPT_DIR}/${SSH_KEY_NAME}"

# ================= 样式定义 =================
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

confirm() {
    local prompt="$1"
    if [ "$ASSUME_YES" = true ]; then
        return 0
    fi
    read -p "${prompt} [Y/n] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z "${REPLY:-}" ]]; then
        return 0
    fi
    return 1
}

resolve_ssh_key() {
    if [ -n "${SSH_KEY:-}" ] && [ -f "${SSH_KEY}" ]; then
        echo "${SSH_KEY}"
        return 0
    fi

    if [ -f "${DEFAULT_SSH_KEY}" ]; then
        echo "${DEFAULT_SSH_KEY}"
        return 0
    fi

    return 1
}

ensure_zip_has_required_files() {
    local zip_file="$1"
    if ! unzip -l "$zip_file" | grep -qE '(^|[[:space:]])index\.html$'; then
        log_error "压缩包缺少 index.html: ${zip_file}"
    fi
    if ! unzip -l "$zip_file" | grep -qE '(^|[[:space:]])_app\.config\.js$'; then
        log_error "压缩包缺少 _app.config.js（生产环境接口配置必须一起发布）: ${zip_file}"
    fi
    if ! unzip -l "$zip_file" | grep -qE '(^|[[:space:]])version\.json$'; then
        log_error "压缩包缺少 version.json（版本检测必须一起发布）: ${zip_file}"
    fi
}

pack_dist() {
    if ! command -v zip &> /dev/null; then
        log_error "系统未安装 zip 命令，无法自动打包"
    fi
    if [ ! -f "${DIST_DIR}/index.html" ]; then
        log_error "未找到 ${DIST_DIR}/index.html，请先在仓库根目录执行: pnpm build:antd"
    fi
    if [ ! -f "${DIST_DIR}/_app.config.js" ]; then
        log_error "未找到 ${DIST_DIR}/_app.config.js，请确认生产构建已完成"
    fi
    if [ ! -f "${DIST_DIR}/version.json" ]; then
        log_error "未找到 ${DIST_DIR}/version.json，请确认生产构建已完成"
    fi

    log_info "正在打包 dist 目录..."
    rm -f "${DIST_ZIP}"
    # 进入 dist 打包，解压后直接是站点文件，而不是套一层 dist/
    # 排除误打进包里的 zip
    (
        cd "${DIST_DIR}"
        zip -r -q "${DIST_ZIP}" . -x "*.zip" -x "*.map"
    )

    if [ ! -f "${DIST_ZIP}" ]; then
        log_error "打包失败: ${DIST_ZIP}"
    fi
    log_success "打包完成: ${DIST_ZIP}"
}

# ================= 脚本逻辑 =================

ASSUME_YES=false
FROM_DIST=false
LOCAL_FILE=""
CLEANUP_REQUIRED=false

for arg in "$@"; do
    case "$arg" in
        -y|--yes)
            ASSUME_YES=true
            ;;
        --from-dist)
            FROM_DIST=true
            ;;
        -h|--help)
            echo "用法: $0 [-y] [--from-dist] [zip 文件路径]"
            echo "  不传路径时自动使用 ${DIST_ZIP} 或打包 ${DIST_DIR}"
            echo "  --from-dist  忽略已有 dist.zip，始终从 dist 重新打包"
            echo "  发布目标: ${SITE_URL}  →  ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}"
            exit 0
            ;;
        -*)
            log_error "未知参数: ${arg}"
            ;;
        *)
            LOCAL_FILE="$arg"
            ;;
    esac
done

INVOKE_CWD="$(pwd)"
cd "${SCRIPT_DIR}"

if [ -z "${LOCAL_FILE}" ]; then
    if [ "${FROM_DIST}" = true ]; then
        if [ ! -d "${DIST_DIR}" ]; then
            log_error "未找到 ${DIST_DIR}，请先执行: pnpm build:antd"
        fi
        pack_dist
        LOCAL_FILE="${DIST_ZIP}"
        CLEANUP_REQUIRED=true
    elif [ -f "${DIST_ZIP}" ]; then
        log_info "未指定文件路径，发现 ${DIST_ZIP}"
        if confirm "是否上传该 dist.zip?"; then
            LOCAL_FILE="${DIST_ZIP}"
        else
            log_error "操作已取消。"
        fi
    elif [ -d "${DIST_DIR}" ]; then
        log_info "未找到 dist.zip，但发现 dist 目录"
        if confirm "是否打包 dist 目录并上传?"; then
            pack_dist
            LOCAL_FILE="${DIST_ZIP}"
            CLEANUP_REQUIRED=true
        else
            log_error "操作已取消。"
        fi
    else
        log_error "用法: $0 [-y] [文件路径]
示例: $0
示例: $0 dist.zip
错误: 未找到 ${DIST_ZIP} 或 ${DIST_DIR}，请先执行: pnpm build:antd"
    fi
fi

if [[ "${LOCAL_FILE}" != /* ]]; then
    LOCAL_FILE="$(cd "${INVOKE_CWD}" && cd "$(dirname "${LOCAL_FILE}")" && pwd)/$(basename "${LOCAL_FILE}")"
fi

if [ ! -f "${LOCAL_FILE}" ]; then
    log_error "本地文件未找到: ${LOCAL_FILE}"
fi

ensure_zip_has_required_files "${LOCAL_FILE}"

if ! SSH_KEY="$(resolve_ssh_key)"; then
    log_error "SSH 密钥未找到: ${DEFAULT_SSH_KEY}
也可通过环境变量指定: SSH_KEY=/path/to/${SSH_KEY_NAME} $0"
fi

log_info "使用密钥: ${SSH_KEY}"

KEY_PERMS=$(stat -f '%OLp' "${SSH_KEY}" 2>/dev/null || stat -c '%a' "${SSH_KEY}" 2>/dev/null)
if [ -n "${KEY_PERMS}" ] && [ "${KEY_PERMS}" != "600" ] && [ "${KEY_PERMS}" != "400" ]; then
    log_info "私钥权限为 ${KEY_PERMS}，正在修正为 600 ..."
    chmod 600 "${SSH_KEY}" || log_error "无法修改私钥权限，请手动执行: chmod 600 ${SSH_KEY}"
fi

log_info "正在测试与服务器的连接..."
if ! ssh -i "${SSH_KEY}" -o ConnectTimeout=5 -o StrictHostKeyChecking=no "${REMOTE_USER}@${REMOTE_HOST}" "exit"; then
    log_error "无法连接到服务器 ${REMOTE_HOST}。请检查网络、防火墙或密钥权限。"
fi

log_info "正在上传文件到 ${REMOTE_DIR} ..."
if ! scp -i "${SSH_KEY}" -o StrictHostKeyChecking=no "${LOCAL_FILE}" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/temp_deploy.zip"; then
    log_error "文件上传失败。"
fi

log_info "正在服务器上执行解压和部署..."

REMOTE_CMD="
    set -e
    if [ ! -d \"${REMOTE_DIR}\" ]; then
        echo '目录不存在，正在创建...'
        mkdir -p \"${REMOTE_DIR}\"
    fi

    cd \"${REMOTE_DIR}\"

    if ! command -v unzip >/dev/null 2>&1; then
        echo '错误: 服务器未安装 unzip。请先运行 apt-get install unzip 或 yum install unzip'
        exit 1
    fi

    echo '清理旧站 webpack 残留 (static/) 和上一次 Vite 资源目录...'
    rm -rf static js jse css png svg ico woff woff2 ttf eot map

    echo '开始解压...'
    unzip -o temp_deploy.zip

    if [ -f dist/index.html ] && [ ! -f index.html ]; then
        echo '检测到 zip 内套了一层 dist/，正在展开...'
        mv dist/* .
        rmdir dist 2>/dev/null || true
    fi

    rm -f temp_deploy.zip dist.zip

    if [ ! -f index.html ]; then
        echo '错误: 解压后未找到 index.html'
        exit 1
    fi
    if [ ! -f _app.config.js ]; then
        echo '错误: 解压后未找到 _app.config.js'
        exit 1
    fi
    if [ ! -f version.json ]; then
        echo '错误: 解压后未找到 version.json'
        exit 1
    fi

    echo '部署文件校验通过'
"

if ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no "${REMOTE_USER}@${REMOTE_HOST}" "${REMOTE_CMD}"; then
    log_success "部署成功！"
    log_info "访问: ${LOGIN_URL}"
else
    log_error "远程部署脚本执行出错，请检查上方日志。"
fi

if [ "${CLEANUP_REQUIRED}" = true ]; then
    log_info "正在清理临时打包文件 ${LOCAL_FILE} ..."
    rm -f "${LOCAL_FILE}"
    log_success "清理完成"
fi
