# AI工具集 - 后端技术方案

> 作者：代可行 | 日期：2026-04-09

---

## 1. API 接口设计

Base URL: `/api/v1`

### 1.1 工具列表

```
GET /tools
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页条数，默认 20，上限 50 |
| category | string | 否 | 分类筛选，如 `chat`、`image`、`code` |
| tag | string | 否 | 标签筛选，支持逗号分隔多标签 `tag=免费,国产` |
| sort | string | 否 | 排序字段：`hot`（热度，默认）、`new`（最新）、`name`（名称） |

**响应示例：**

```json
{
  "code": 0,
  "data": {
    "total": 128,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "name": "ChatGPT",
        "summary": "OpenAI 推出的对话式 AI 助手",
        "icon_url": "https://cdn.example.com/icons/chatgpt.png",
        "url": "https://chat.openai.com",
        "category": "chat",
        "tags": ["对话", "免费", "海外"],
        "hot": 9999,
        "created_at": "2026-01-15T10:00:00Z"
      }
    ]
  }
}
```

### 1.2 工具详情

```
GET /tools/{id}
```

**响应示例：**

```json
{
  "code": 0,
  "data": {
    "id": 1,
    "name": "ChatGPT",
    "summary": "OpenAI 推出的对话式 AI 助手",
    "description": "ChatGPT 是由 OpenAI 开发的大型语言模型驱动的对话产品……",
    "icon_url": "https://cdn.example.com/icons/chatgpt.png",
    "url": "https://chat.openai.com",
    "category": "chat",
    "tags": ["对话", "免费", "海外"],
    "pricing": "免费 + 付费（$20/月）",
    "hot": 9999,
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-03-20T08:30:00Z"
  }
}
```

### 1.3 搜索

```
GET /tools/search
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 是 | 搜索关键词，匹配名称、简介、标签 |
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页条数，默认 20 |
| category | string | 否 | 可叠加分类筛选 |

**说明：** 后端使用 `LIKE` 或全文索引匹配 `name`、`summary`、`tags` 字段；数据量增长后可迁移至 Elasticsearch。

### 1.4 分类列表

```
GET /categories
```

**响应示例：**

```json
{
  "code": 0,
  "data": [
    { "slug": "chat", "name": "AI 对话", "icon": "💬", "count": 42 },
    { "slug": "image", "name": "AI 绘图", "icon": "🎨", "count": 35 },
    { "slug": "code", "name": "代码辅助", "icon": "💻", "count": 28 },
    { "slug": "video", "name": "视频生成", "icon": "🎬", "count": 12 },
    { "slug": "audio", "name": "语音/音乐", "icon": "🎵", "count": 11 }
  ]
}
```

### 1.5 标签列表

```
GET /tags
```

**响应示例：**

```json
{
  "code": 0,
  "data": [
    { "name": "免费", "count": 56 },
    { "name": "国产", "count": 43 },
    { "name": "海外", "count": 85 },
    { "name": "开源", "count": 19 }
  ]
}
```

---

## 2. 数据库表结构设计

### 2.1 tools 表（AI 工具主表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 主键 |
| name | VARCHAR(100) | NOT NULL, UNIQUE | 工具名称 |
| summary | VARCHAR(255) | NOT NULL | 一句话简介 |
| description | TEXT | | 详细介绍（支持 Markdown） |
| icon_url | VARCHAR(500) | | 图标 URL |
| url | VARCHAR(500) | NOT NULL | 跳转链接 |
| category_slug | VARCHAR(50) | NOT NULL, FK | 所属分类 slug |
| pricing | VARCHAR(255) | | 定价信息 |
| hot | INT | DEFAULT 0 | 热度值 |
| is_active | TINYINT | DEFAULT 1 | 是否上架 |
| created_at | DATETIME | DEFAULT NOW | 创建时间 |
| updated_at | DATETIME | ON UPDATE NOW | 更新时间 |

**索引：**
- `idx_category` (category_slug)
- `idx_hot` (hot DESC)
- `idx_created` (created_at DESC)
- `idx_name` (name) — 搜索用

### 2.2 categories 表（分类表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 主键 |
| slug | VARCHAR(50) | NOT NULL, UNIQUE | 分类标识，如 `chat` |
| name | VARCHAR(50) | NOT NULL | 分类显示名，如"AI 对话" |
| icon | VARCHAR(10) | | emoji 图标 |
| sort_order | INT | DEFAULT 0 | 排序权重 |

### 2.3 tags 表（标签表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 主键 |
| name | VARCHAR(50) | NOT NULL, UNIQUE | 标签名 |

### 2.4 tool_tags 表（工具-标签关联表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| tool_id | INT | FK → tools.id | 工具 ID |
| tag_id | INT | FK → tags.id | 标签 ID |

**索引：** PRIMARY (tool_id, tag_id)，`idx_tag_id` (tag_id)

### ER 关系

```
categories 1 ──── N tools
tools      N ──── N tags  (via tool_tags)
```

---

## 3. 推荐技术栈

| 层面 | 选型 | 理由 |
|------|------|------|
| **语言/框架** | Python + FastAPI | 开发快、生态好、异步支持、自动生成 OpenAPI 文档 |
| **数据库** | MySQL 8.0 | 成熟稳定、全文索引支持、运维成本低 |
| **ORM** | SQLAlchemy 2.0 + Alembic | 类型安全、迁移管理方便 |
| **缓存** | Redis | 热门列表/分类/标签缓存，搜索结果缓存 |
| **搜索**（后期） | Elasticsearch | 数据量 > 5000 或搜索体验要求提升时接入 |
| **部署** | Docker + Nginx | 容器化部署，Nginx 反代 + 静态资源 |
| **CI/CD** | GitHub Actions | 自动测试 + 镜像构建 + 部署 |

### 备选方案

如果团队更偏好 Go / Node.js：
- **Go + Gin**：性能更好，适合高并发场景
- **Node.js + NestJS**：前后端统一语言，适合全栈小团队

当前推荐 FastAPI，核心考虑：**快速出活、文档自动生成、团队 Python 经验普遍较好**。

---

## 4. 工作量评估

| 任务 | 预估工时 | 说明 |
|------|----------|------|
| 项目初始化（框架搭建、DB 建表、配置） | 0.5d | FastAPI 项目脚手架 + Alembic 迁移 |
| 分类/标签 CRUD | 0.5d | 管理后台用，含数据录入脚本 |
| 工具列表 + 详情 API | 1d | 含分页、排序、缓存 |
| 搜索 API | 0.5d | 初期 LIKE 搜索，预留 ES 接口 |
| 分类筛选 + 标签筛选 | 0.5d | 多条件组合查询 |
| 数据录入脚本 | 0.5d | 批量导入工具数据的脚本 |
| Docker 部署配置 | 0.5d | Dockerfile + docker-compose + Nginx |
| **合计** | **4d（约 1 周）** | 含联调与基本自测 |

### 里程碑

- **D1-D2**：项目搭建 + 核心模型 + 列表/详情 API
- **D3**：搜索 + 分类/标签筛选 + 缓存
- **D4**：数据录入 + 部署配置 + 联调

---

## 附录：统一响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

- `code = 0`：成功
- `code != 0`：业务错误，`message` 为错误描述
- HTTP 状态码同步：200 成功，400 参数错误，404 未找到，500 服务端错误
