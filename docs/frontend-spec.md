# AI 工具集 - 前端技术方案

## 1. 技术栈选择

| 层次 | 技术选型 | 说明 |
|------|---------|------|
| **页面结构** | HTML5 + 语义化标签 | 良好的可访问性和 SEO 基础 |
| **样式** | Tailwind CSS v3（CDN）| 原子化 CSS，快速构建响应式 UI，无需构建链路 |
| **交互逻辑** | 原生 JavaScript（ES6+） | 无框架依赖，轻量、启动快，适合内容展示型页面 |
| **构建工具** | 无（纯静态）| 直接浏览器打开 index.html，适合快速迭代 |
| **图标** | Lucide Icons（CDN） | 开源、一致、tree-shakable |
| **字体** | Google Fonts（Inter + Noto Sans SC） | 现代无衬线 + 中文字体支持 |

> **备选**：若后续需要 SPA 路由，可切换至 Vue 3（CDN）或 React + Vite，具体视需求扩展性而定。当前 MVP 阶段优先轻量。

---

## 2. 目录结构

```
ai-tools-hub/
├── index.html              # 入口页面
├── css/
│   └── style.css           # 全局样式（覆盖 Tailwind 变量 + 自定义）
├── js/
│   ├── app.js              # 主逻辑：渲染工具卡片、筛选、搜索
│   └── data.js             # Mock 数据（6 个工具的 JSON）
├── assets/
│   └── icons/              # 备用本地 SVG 图标（非必须）
└── docs/
    └── frontend-spec.md    # 本文档
```

---

## 3. 核心组件设计

### 3.1 工具卡片（ToolCard）

```
┌─────────────────────────────────┐
│  [Icon]  工具名称                │
│  简介描述（2行截断）             │
│                                 │
│  [标签1] [标签2] [标签3]        │
│                                 │
│  [🚀 访问 →]                    │
└─────────────────────────────────┘
```

**状态**：默认、悬停（阴影加深 + 边框高亮）、已收藏（本地标记）

### 3.2 搜索栏（SearchBar）

- 实时输入过滤（debounce 200ms）
- 支持按名称 / 简介关键词匹配
- 清空按钮

### 3.3 标签筛选（TagFilter）

- 横向滚动标签列表（支持多选）
- 点击标签仅显示匹配工具
- "全部"标签一键重置

### 3.4 页头（Header）

- Logo + 标语
- 暗色模式切换按钮（CSS 变量 + `localStorage` 持久化）

### 3.5 底部（Footer）

- 版权信息 + GitHub 链接占位

---

## 4. Mock 数据

> 存放于 `js/data.js`，统一导出 `TOOLS_DATA` 数组。

```json
[
  {
    "id": 1,
    "name": "ChatGPT",
    "icon": "message-circle",
    "description": "OpenAI 出品的对话式 AI 助手，支持多轮对话、代码生成、创意写作等场景。",
    "tags": ["聊天", "AI助手", "GPT-4"],
    "url": "https://chat.openai.com",
    "category": "chat"
  },
  {
    "id": 2,
    "name": "Midjourney",
    "icon": "image",
    "description": "通过自然语言描述生成高质量艺术图像，Midjourney v6 在细节和风格上再创新高。",
    "tags": ["绘图", "AI绘画", "创意"],
    "url": "https://www.midjourney.com",
    "category": "image"
  },
  {
    "id": 3,
    "name": "GitHub Copilot",
    "icon": "code-2",
    "description": "AI 代码补全插件，深度集成 VS Code，支持 Python、JS、Go 等主流语言实时补全。",
    "tags": ["代码辅助", "IDE插件", "效率"],
    "url": "https://github.com/features/copilot",
    "category": "code"
  },
  {
    "id": 4,
    "name": "DALL·E 3",
    "icon": "palette",
    "description": "OpenAI 图像生成模型，精准理解复杂提示词，可直接在 ChatGPT Plus 中调用。",
    "tags": ["绘图", "AI绘画", "图像生成"],
    "url": "https://openai.com/dall-e-3",
    "category": "image"
  },
  {
    "id": 5,
    "name": "Claude",
    "icon": "brain",
    "description": "Anthropic 推出的安全对齐 AI，擅长长文档分析、逻辑推理、创意写作，上下文窗口达 200K token。",
    "tags": ["聊天", "长文本", "安全AI"],
    "url": "https://claude.ai",
    "category": "chat"
  },
  {
    "id": 6,
    "name": "Stable Diffusion WebUI",
    "icon": "sparkles",
    "description": "开源本地部署图像生成工具，支持 LoRA 模型定制、ControlNet 控制，可完全离线运行。",
    "tags": ["绘图", "开源", "本地部署"],
    "url": "https://github.com/AUTOMATIC1111/stable-diffusion-webui",
    "category": "image"
  }
]
```

---

## 5. 预计代码量

| 文件 | 预计行数 | 说明 |
|------|---------|------|
| `index.html` | ~60 行 | 页面骨架，引入 CDN 资源 |
| `css/style.css` | ~80 行 | CSS 变量、Tailwind 覆盖、暗色模式 |
| `js/data.js` | ~30 行 | Mock 数据（6条） |
| `js/app.js` | ~150 行 | 渲染逻辑、搜索、标签筛选、收藏持久化 |
| **合计** | **~320 行** | 纯前端，轻量可维护 |

---

## 6. 开发节奏建议

| 阶段 | 内容 | 预计工时 |
|------|------|---------|
| Day 1 | 页面骨架 + 静态卡片渲染 | 1h |
| Day 2 | 搜索 + 标签筛选功能 | 1h |
| Day 3 | 暗色模式 + 悬停动效 + 响应式 | 1h |
| Day 4 | 细节打磨 + 多设备测试 | 1h |

> 总计约 **4 小时**可完成 MVP，交付可直接打开的 `index.html`。

---

*文档版本：v0.1 | 作者：前端工程师 Subagent | 日期：2026-04-09*
