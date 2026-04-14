# AI工具集 - 项目索引

> 项目经理：Carroll | 启动日期：2026-04-09 | 预计工期：MVP 2周

---

## 📁 文档目录

| 文件 | 作者 | 说明 |
|------|------|------|
| `docs/prd.md` | 产品经理 | 产品需求文档 |
| `docs/frontend-spec.md` | 前端工程师 | 前端技术方案 |
| `docs/backend-spec.md` | 代可行 | 后端技术方案 |
| `design/ui-design-spec.md` | UI设计师 | UI设计规范 |
| `qa/test-plan.md` | 质量工程师 | 测试方案 |
| `meetings/kickoff-notes.md` | 项目经理 | 启动会议纪要 |

---

## 🎯 项目概览

**产品名称：** AI工具集  
**一句话定位：** 面向中文用户的AI工具导航站，聚合展示+智能分类+一键跳转  
**MVP目标：** 2周内上线，用户3步内找到并跳转任意收录工具

---

## 🚀 如何启动

### 前端（纯静态，无需构建）

```bash
cd code/frontend
open index.html   # macOS 直接用浏览器打开
```

### 后端

```bash
cd code/backend
pip install -r requirements.txt
python init_data.py   # 初始化数据库（含25个工具数据）
python main.py         # 启动服务 → http://localhost:8000
```

---

## 📂 代码结构

```
code/
├── tools-data.json         ← 产品经理提供的工具数据（20个）
└── backend/
    ├── main.py             ← FastAPI 主应用（5个API路由）
    ├── models.py           ← SQLAlchemy 模型（4张表）
    ├── schemas.py          ← Pydantic 响应模型
    ├── database.py         ← SQLite 连接配置
    ├── init_data.py        ← 种子数据脚本（25个工具）
    ├── requirements.txt    ← 依赖列表
    ├── README.md           ← 后端启动说明
    └── ai_tools.db         ← SQLite 数据库文件
```

### 前端文件

```
code/frontend/
├── index.html              ← 主页面
├── css/style.css           ← 样式（含暗色模式）
├── js/data.js              ← Mock数据（6个）
└── js/app.js              ← 渲染逻辑（搜索/筛选/跳转）
```

---

## 📋 交付物清单

### 产品文档
- [x] PRD（含竞品分析、里程碑计划、20个首批收录工具清单）
- [x] UI设计规范（含配色/布局/动效/字体/响应式规范）
- [x] 前端技术方案（HTML5+Tailwind CDN+原生JS，约320行，4h可完成）
- [x] 后端技术方案（FastAPI+MySQL+Redis，4d工时）
- [x] 测试方案（7条用例+12项提测Checklist+质量标准）

### 代码交付
- [x] 前端MVP（index.html + css + js，完整搜索/筛选/暗色模式）
- [x] 后端MVP（FastAPI + SQLite，5个API路由，25个工具数据）
- [x] 工具数据（20个真实AI工具JSON）

---

## 📅 里程碑

| 版本 | 周期 | 目标 |
|------|------|------|
| M1 v0.1 | 2周 | MVP：分类展示+搜索+跳转，20个工具 |
| M2 v0.2 | 2周 | 标签筛选+详情页+收藏+暗色模式 |
| M3 v1.0 | 2周 | 正式发布：热门推荐+周更+提交入口 |
| M4 v1.1+ | 待定 | 评分评论+工具对比+移动端优化 |

---

## ✅ MVP开发完成清单（2026-04-09）

| 角色 | 交付物 | 状态 |
|------|--------|------|
| 📋 产品经理 | 20个工具真实数据 tools-data.json | ✅ 完成 |
| 👩‍🎨 UI设计师 | UI设计规范 ui-design-spec.md | ✅ 完成 |
| 📦 前端工程师 | MVP前端页面（HTML/CSS/JS） | ✅ 完成 |
| 🔧 代可行 | MVP后端（FastAPI+SQLite，25工具） | ✅ 完成 |
| ✅ 质量工程师 | 测试方案 test-plan.md | ✅ 完成 |

---

*最后更新：2026-04-09 by 项目经理*
