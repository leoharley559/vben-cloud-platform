# API 文档目录说明

本目录用于存放**后端接口定义**，供团队人工开发与 **AI 辅助编码**时引用。  
**接口文档 ≠ 环境配置**：请求发到哪由 `apps/web-antd/.env*` 决定；接口长什么样由本目录决定。

---

## 目录结构

```text
api-docs/
├── README.md                        # 本说明
├── swagger/
│   ├── example.openapi.json         # ★ 内置虚构示例（团队学习用）
│   └── .gitkeep
└── postman/
    └── .gitkeep
```

---

## 内置示例：`swagger/example.openapi.json`

| 项 | 说明 |
|---|---|
| 是否真实 | **否**，全部为虚构示例数据 |
| 用途 | 学习 OpenAPI 结构、演示 AI 如何根据文档生成前端代码 |
| 与模版关系 | 路径风格对齐 vben `backend-mock`（`/auth/login`、`code: 0`） |
| 业务示例 | 虚构「订单管理」CRUD：`/order/list`、`/order`、`/order/{id}` |

### 示例包含的接口

| 分组 | 路径 | 方法 | 说明 |
|---|---|---|---|
| 认证 | `/auth/login` | POST | 登录，返回 `accessToken` |
| 认证 | `/auth/logout` | POST | 登出 |
| 认证 | `/auth/refresh` | POST | 刷新 Token |
| 认证 | `/auth/codes` | GET | 权限码列表 |
| 用户 | `/user/info` | GET | 当前用户信息 |
| 订单 | `/order/list` | GET | 分页列表（虚构） |
| 订单 | `/order` | POST | 创建 |
| 订单 | `/order/{id}` | GET | 详情 |
| 订单 | `/order/{id}` | PUT | 更新 |
| 订单 | `/order/{id}` | DELETE | 删除 |

### 统一响应约定（示例）

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

对应环境变量：`VITE_API_SUCCESS_CODE=0`（接真实后端若为 `200` 需同步修改）。

---

## 新项目：如何替换为真实 Swagger

1. 向后端或 Swagger UI 索取 OpenAPI 3.0 导出文件  
2. 保存为 `api-docs/swagger/<项目名>.openapi.json`（不要覆盖 `example.openapi.json`，保留作参考）  
3. 检查 `code` 成功值、分页字段名是否与前端 `request.ts` 一致  
4. 在 Cursor 中 `@api-docs/swagger/你的文件.json` 开始生成代码  

---

## Postman Collection

1. Postman → Export → **Collection v2.1**  
2. 保存到 `api-docs/postman/<项目名>.collection.json`  
3. AI 对话中 `@api-docs/postman/...` 引用  

敏感信息（密码、Token、生产域名）请使用 Postman Environment，**不要写进仓库**。

---

## AI 编码推荐提示词

```text
请阅读 @api-docs/swagger/example.openapi.json 中「订单」相关 paths，
在 apps/web-antd 中生成：
1. src/api/order/index.ts
2. src/types/orderTypes.ts
3. src/router/routes/modules/order.ts
4. src/views/order/index.vue（列表 + 搜索 + 分页）

要求：
- 使用 requestClient，成功 code 与 VITE_API_SUCCESS_CODE 一致
- 路由 meta.title 使用 i18n key
- 表格参考 adapter/vxe-table.ts，表单参考 adapter/form.ts
- 不要修改 packages/ 目录
```

---

## 文档更新规范

| 场景 | 操作 |
|---|---|
| 后端新增接口 | 重新导出 Swagger，更新对应 json |
| 字段变更 | 同步改 `src/api/`、`src/types/`，必要时改页面 |
| 多模块 | 按模块拆分多个文件，如 `user.openapi.json`、`order.openapi.json` |
| 版本管理 | 大版本可在文件名加日期，如 `order.2026-05-14.openapi.json` |

---

## 在线预览（可选）

- [Swagger Editor](https://editor.swagger.io/)：粘贴 JSON 可视化查看  
- VS Code 插件：OpenAPI (Swagger) Editor  

---

更多团队流程见仓库根目录 **`模版使用说明.md`**。
