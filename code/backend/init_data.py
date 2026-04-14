"""
初始化种子数据脚本
从 tools-data.json 读取工具数据，写入 SQLite 数据库
支持幂等运行：每次运行先清空 tools 表，再重新导入

运行方式：python init_data.py
"""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal, Base
from models import Category, Tag, Tool, tool_tags


def init_db():
    """创建所有表"""
    Base.metadata.create_all(bind=engine)
    print("✅ 数据库表创建完成")


def load_seed_data():
    """
    从 tools-data.json 动态加载种子数据
    幂等：先清空 tools 表，再重新写入
    分类和标签从JSON动态提取，无需硬编码
    """
    db = SessionLocal()
    try:
        # ============ 从 JSON 动态提取分类和标签 ============
        json_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "tools-data.json"
        )
        with open(json_path, "r", encoding="utf-8") as f:
            tools_json = json.load(f)

        print(f"📖 从 tools-data.json 读取到 {len(tools_json)} 个工具")

        # 动态收集所有分类
        all_categories = {}
        for t in tools_json:
            slug = t.get("category", "other")
            if slug not in all_categories:
                all_categories[slug] = {
                    "slug": slug,
                    "name": slug_to_name(slug),
                    "icon": slug_to_icon(slug),
                    "sort_order": 999,
                }

        # 动态收集所有标签
        all_tags = set()
        for t in tools_json:
            all_tags.update(t.get("tags", []))

        # ============ 分类：保留旧数据 + 动态新增 ============
        existing_cats = {c.slug: c for c in db.query(Category).all()}
        for slug, cat_data in all_categories.items():
            if slug in existing_cats:
                # 更新名称和图标
                existing_cats[slug].name = cat_data["name"]
                existing_cats[slug].icon = cat_data["icon"]
                all_categories[slug] = existing_cats[slug]
            else:
                # 新增分类
                cat = Category(**cat_data)
                db.add(cat)
                db.flush()
                all_categories[slug] = cat

        print(f"📂 分类同步完成，共 {len(all_categories)} 个分类")

        # ============ 标签：保留旧数据 + 动态新增 ============
        existing_tags = {t.name: t for t in db.query(Tag).all()}
        tag_map = dict(existing_tags)
        for tag_name in sorted(all_tags):
            if tag_name not in existing_tags:
                tag = Tag(name=tag_name)
                db.add(tag)
                db.flush()
                tag_map[tag_name] = tag

        print(f"🏷️  标签同步完成，共 {len(tag_map)} 个标签")

        # ============ 幂等：清空 tools 及关联表 ============
        db.query(tool_tags).delete()
        db.query(Tool).delete()
        db.commit()
        print("🗑️  已清空 tools 表（幂等模式）")

        # ============ 批量写入工具 ============
        for tool_item in tools_json:
            slug = tool_item.get("category", "other")
            cat_obj = all_categories.get(slug)

            tool_record = {
                "name": tool_item["name"],
                "summary": tool_item.get("summary", ""),
                "description": tool_item.get("description", ""),
                "icon_url": tool_item.get("icon", ""),
                "url": tool_item.get("url", ""),
                "category_slug": slug if cat_obj else "other",
                "pricing": tool_item.get("pricing", ""),
                "hot": 1000 if tool_item.get("featured") else 500,
                "is_active": 1,
            }

            tool = Tool(**tool_record)
            db.add(tool)
            db.flush()

            # 关联标签
            for tag_name in tool_item.get("tags", []):
                if tag_name in tag_map:
                    tool.tags.append(tag_map[tag_name])

        db.commit()
        print(f"✅ 种子数据导入完成，共 {len(tools_json)} 个工具")

        # ============ 验证 ============
        total = db.query(Tool).count()
        cat_count = db.query(Category).count()
        tag_count = db.query(Tag).count()
        print(f"📊 验证：数据库现有 {total} 个工具，{cat_count} 个分类，{tag_count} 个标签")

    except Exception as e:
        db.rollback()
        print(f"❌ 错误：{e}")
        raise
    finally:
        db.close()


def slug_to_name(slug: str) -> str:
    """将分类slug转换为中文名称"""
    mapping = {
        "chat": "AI 对话",
        "image": "AI 绘图",
        "code": "代码辅助",
        "video": "视频生成",
        "audio": "语音/音乐",
        "writing": "写作创作",
        "productivity": "效率办公",
        "search": "AI 搜索",
        "agent": "AI Agent",
        "dev": "AI 开发平台",
        "data": "AI 数据分析",
        "prompt": "提示词工具",
        "security": "AI 安全合规",
        "3d": "3D 生成",
        "design": "设计工具",
        "hardware": "AI 硬件",
        "education": "AI 教育",
        "other": "其他",
        "pm": "AI 项目管理",
    }
    return mapping.get(slug, slug)


def slug_to_icon(slug: str) -> str:
    """将分类slug转换为emoji图标"""
    mapping = {
        "chat": "💬",
        "image": "🎨",
        "code": "💻",
        "video": "🎬",
        "audio": "🎵",
        "writing": "✍️",
        "productivity": "🚀",
        "search": "🔍",
        "agent": "🤖",
        "dev": "⚙️",
        "data": "📊",
        "prompt": "📜",
        "security": "🛡️",
        "3d": "🏛️",
        "design": "🎯",
        "hardware": "🔌",
        "education": "🎓",
        "other": "🔧",
        "pm": "📋",
    }
    return mapping.get(slug, "🔧")


if __name__ == "__main__":
    init_db()
    load_seed_data()
