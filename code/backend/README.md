# AI工具集 - MVP 后端服务

> FastAPI + SQLAlchemy + SQLite，轻量启动，无需安装 MySQL

---

## 快速启动

### 1. 创建虚拟环境（推荐）

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # macOS/Linux
# venv\Scripts\activate      # Windows
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 初始化数据库 & 种子数据

```bash
python init_data.py
```

> 会自动创建 `ai_tools.db`（SQLite），并写入 25 个种子工具数据

### 4. 启动服务

```bash
python main.py
# 或使用 uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

服务地址：**http://localhost:8000**

自动生成文档：**http://localhost:8000/docs**

---

## API 列表

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/v1/tools` | 工具列表（分页/分类/标签/搜索/排序） |
| GET | `/api/v1/tools/{id}` | 工具详情 |
| GET | `/api/v1/tools/search` | 搜索工具 |
| GET | `/api/v1/categories` | 分类列表（含工具数量） |
| GET | `/api/v1/tags` | 标签列表（含使用次数） |
| GET | `/health` | 健康检查 |

---

## API 详情

### GET /api/v1/tools

**参数：**

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `page` | int | 1 | 页码 |
| `page_size` | int | 20 | 每页条数（上限50） |
| `category` | string | - | 分类筛选，如 `chat`、`image` |
| `tag` | string | - | 标签筛选，支持逗号分隔多标签 |
| `search` | string | - | 搜索关键词（匹配名称/简介） |
| `sort` | string | `hot` | 排序：`hot`/`new`/`name` |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 25,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "name": "ChatGPT",
        "summary": "OpenAI 推出的对话式 AI 助手",
        "icon_url": "",
        "url": "https://chat.openai.com",
        "category": "chat",
        "tags": ["海外", "免费", "付费", "对话"],
        "hot": 9999,
        "created_at": "2026-01-15T10:00:00"
      }
    ]
  }
}
```

### GET /api/v1/tools/{id}

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "ChatGPT",
    "summary": "OpenAI 推出的对话式 AI 助手",
    "description": "ChatGPT 是由 OpenAI 开发的大型语言模型...",
    "icon_url": "",
    "url": "https://chat.openai.com",
    "category": "chat",
    "tags": ["海外", "免费", "付费", "对话"],
    "pricing": "免费（GPT-3.5）/ $20/月（Plus）",
    "hot": 9999,
    "created_at": "2026-01-15T10:00:00",
    "updated_at": null
  }
}
```

### GET /api/v1/categories

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {"slug": "chat", "name": "AI 对话", "icon": "💬", "count": 5},
    {"slug": "image", "name": "AI 绘图", "icon": "🎨", "count": 4}
  ]
}
```

### GET /api/v1/tags

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {"name": "免费", "count": 18},
    {"name": "海外", "count": 15},
    {"name": "付费", "count": 13}
  ]
}
```

---

## 文件结构

```
backend/
├── main.py          # FastAPI 主应用
├── models.py        # SQLAlchemy 模型
├── schemas.py       # Pydantic 模型
├── database.py      # 数据库连接配置
├── init_data.py     # 初始化脚本
├── requirements.txt # 依赖列表
└── README.md        # 本文件
```

---

## 技术栈

- **框架**：FastAPI 0.115
- **ORM**：SQLAlchemy 2.0
- **数据库**：SQLite 3（`ai_tools.db`）
- **验证**：Pydantic 2.9
- **服务**：Uvicorn
