# vben-admin-demo · 团队 web-antd 后台模版

基于 [vue-vben-admin 5.7.0](https://github.com/vbenjs/vue-vben-admin) 裁剪的 **Ant Design Vue 专用模版**，用于团队统一新建后台项目。

| 项 | 说明 |
|---|---|
| 模版仓库 | `git@github-leoharley559:leoharley559/vben-admin-demo.git` |
| 主应用 | `apps/web-antd` |
| 详细文档 | **[模版使用说明.md](./模版使用说明.md)**（使用步骤、目录规范、API 配置、升级步骤） |
| API 文档目录 | [api-docs/README.md](./api-docs/README.md) |

---

## 快速开始（克隆即可开发）

```bash
git clone git@github-leoharley559:leoharley559/vben-admin-demo.git
cd vben-admin-demo

# 首次在本机配置 pnpm
corepack enable && corepack prepare pnpm@10.33.0 --activate

pnpm install
pnpm dev
```

| 项 | 值 |
|---|---|
| 前端地址 | http://localhost:5666/ |
| Mock 账号 | `vben` / `123456` |
| 业务代码 | `apps/web-antd/src/` |

仓库已内置 `.env` / `.env.development`（Mock 模式），**无需复制 `.env.example` 即可启动**。

---

## 环境要求

- Node.js：`^20.19.0` / `^22.18.0` / `^24.0.0`
- pnpm：`>= 10.0.0`（必须用 pnpm，不可用 npm/yarn）

---

## 常用命令

```bash
pnpm dev          # 启动开发（= pnpm dev:antd）
pnpm build:antd   # 生产构建
pnpm preview      # 预览构建产物
pnpm lint         # 代码检查
pnpm check:type   # 类型检查
```

---

## 新建业务项目（从模版拷贝）

不要多个产品共改本仓库。请：

1. 克隆本仓库或 GitHub「Use this template」
2. 修改 `VITE_APP_NAMESPACE`、密钥、Logo、API 等（见 `模版使用说明.md` 第 3 节）
3. 推送到**新业务仓库**

---

## 模版升级（维护者）

与 [vben 官方](https://github.com/vbenjs/vue-vben-admin) 合并升级，完整步骤见 **`模版使用说明.md` 第 10 节**。

---

## 许可

MIT（继承自 vue-vben-admin）
