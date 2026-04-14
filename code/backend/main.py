"""
AI工具集 MVP 后端服务
FastAPI + SQLAlchemy + SQLite
"""
from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, select
from typing import Optional, List

from database import engine, get_db, Base
from models import Tool, Category, Tag, tool_tags, ToolSubmission
from schemas import (
    ResponseModel,
    ToolListItem,
    ToolDetail,
    CategoryItem,
    TagWithCount,
    PaginatedTools,
    ToolSubmitRequest,
    ToolSubmitResponse,
)


# ============ 启动事件 ============
def startup():
    Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AI工具集 API",
    version="1.0.0",
    description="AI工具导航站 MVP 后端服务",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ 统一响应构造 ============
def ok(data=None, message: str = "success"):
    return ResponseModel(code=0, message=message, data=data)


def fail(code: int, message: str):
    return ResponseModel(code=code, message=message, data=None)


# ============ API 路由 ============

@app.get("/")
def root():
    return ok({"name": "AI工具集 API", "version": "1.0.0", "status": "running"})


# ---- GET /api/v1/tools ----
@app.get("/api/v1/tools", response_model=ResponseModel)
def list_tools(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=50, description="每页条数"),
    category: Optional[str] = Query(None, description="分类筛选"),
    tag: Optional[str] = Query(None, description="标签筛选，支持逗号分隔多标签"),
    search: Optional[str] = Query(None, description="搜索关键词（匹配名称/简介/标签）"),
    sort: str = Query("hot", description="排序：hot/new/name"),
    featured: Optional[bool] = Query(None, description="只返回精选工具"),
    db: Session = Depends(get_db),
):
    # 构建查询
    query = db.query(Tool).options(
        joinedload(Tool.category),
        joinedload(Tool.tags),
    ).filter(Tool.is_active == 1)

    # 精选工具筛选（hot >= 1000 为 featured）
    if featured is not None:
        min_hot = 1000 if featured else 0
        query = query.filter(Tool.hot >= min_hot)

    # 分类筛选
    if category:
        query = query.filter(Tool.category_slug == category)

    # 标签筛选（支持多标签，逗号分隔）
    if tag:
        tag_list = [t.strip() for t in tag.split(",") if t.strip()]
        if tag_list:
            subq = (
                select(tool_tags.c.tool_id)
                .join(Tag, Tag.id == tool_tags.c.tag_id)
                .filter(Tag.name.in_(tag_list))
                .distinct()
                .scalar_subquery()
            )
            query = query.filter(Tool.id.in_(subq))

    # 搜索（名称、简介 LIKE）
    if search:
        search_like = f"%{search}%"
        query = query.filter(
            (Tool.name.ilike(search_like)) | (Tool.summary.ilike(search_like))
        )

    # 排序
    if sort == "new":
        query = query.order_by(Tool.created_at.desc())
    elif sort == "name":
        query = query.order_by(Tool.name.asc())
    else:  # hot
        query = query.order_by(Tool.hot.desc())

    # 总数
    total = query.count()

    # 分页
    offset = (page - 1) * page_size
    tools = query.offset(offset).limit(page_size).all()

    items = [ToolListItem.from_orm_model(t) for t in tools]
    return ok(PaginatedTools(
        total=total,
        page=page,
        page_size=page_size,
        items=items,
    ).model_dump())


# ---- GET /api/v1/tools/featured ----
@app.get("/api/v1/tools/featured", response_model=ResponseModel)
def list_featured_tools(
    page_size: int = Query(20, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """返回精选推荐工具列表（最多20个，按热度排序）"""
    tools = (
        db.query(Tool)
        .options(joinedload(Tool.category), joinedload(Tool.tags))
        .filter(Tool.is_active == 1)
        .order_by(Tool.hot.desc())
        .limit(page_size)
        .all()
    )
    items = [ToolListItem.from_orm_model(t) for t in tools]
    return ok([t.model_dump() for t in items])


# ---- POST /api/v1/tools/submit ----
@app.post("/api/v1/tools/submit", response_model=ResponseModel)
def submit_tool(req: ToolSubmitRequest, db: Session = Depends(get_db)):
    """
    提交新工具
    - name 和 url 为必填
    - 写入 tool_submissions 表，状态默认为 pending
    """
    if not req.name.strip() or not req.url.strip():
        return fail(400, "name 和 url 为必填参数")

    submission = ToolSubmission(
        name=req.name.strip(),
        url=req.url.strip(),
        description=req.description.strip(),
        category=req.category.strip(),
        tags=req.tags.strip(),
        submitter_email=req.submitter_email.strip(),
        status="pending",
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return ok(
        ToolSubmitResponse(id=str(submission.id)).model_dump(),
        message="提交成功，我们将尽快审核",
    )


# ---- GET /api/v1/tools/{id} ----
@app.get("/api/v1/tools/{tool_id}", response_model=ResponseModel)
def get_tool(tool_id: int, db: Session = Depends(get_db)):
    tool = (
        db.query(Tool)
        .options(joinedload(Tool.category), joinedload(Tool.tags))
        .filter(Tool.id == tool_id, Tool.is_active == 1)
        .first()
    )
    if not tool:
        raise HTTPException(status_code=404, detail="工具不存在")
    return ok(ToolDetail.from_orm_model(tool).model_dump())


# ---- GET /api/v1/categories ----
@app.get("/api/v1/categories", response_model=ResponseModel)
def list_categories(db: Session = Depends(get_db)):
    results = (
        db.query(
            Category.slug,
            Category.name,
            Category.icon,
            Category.sort_order,
            func.count(Tool.id).label("count"),
        )
        .outerjoin(Tool, (Tool.category_slug == Category.slug) & (Tool.is_active == 1))
        .group_by(Category.id)
        .order_by(Category.sort_order.asc())
        .all()
    )
    items = [
        CategoryItem(
            slug=r.slug,
            name=r.name,
            icon=r.icon or "",
            count=r.count,
        ).model_dump()
        for r in results
    ]
    return ok(items)


# ---- GET /api/v1/tags ----
@app.get("/api/v1/tags", response_model=ResponseModel)
def list_tags(db: Session = Depends(get_db)):
    results = (
        db.query(
            Tag.name,
            func.count(tool_tags.c.tool_id).label("count"),
        )
        .outerjoin(tool_tags, tool_tags.c.tag_id == Tag.id)
        .group_by(Tag.id)
        .order_by(func.count(tool_tags.c.tool_id).desc())
        .all()
    )
    items = [
        TagWithCount(name=r.name, count=r.count).model_dump()
        for r in results
    ]
    return ok(items)


# ---- GET /api/v1/tools/search ----
@app.get("/api/v1/tools/search", response_model=ResponseModel)
def search_tools(
    q: str = Query(..., description="搜索关键词"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    like = f"%{q}%"
    query = (
        db.query(Tool)
        .options(joinedload(Tool.category), joinedload(Tool.tags))
        .filter(
            Tool.is_active == 1,
            (Tool.name.ilike(like)) | (Tool.summary.ilike(like)),
        )
    )
    if category:
        query = query.filter(Tool.category_slug == category)

    total = query.count()
    offset = (page - 1) * page_size
    tools = query.order_by(Tool.hot.desc()).offset(offset).limit(page_size).all()

    return ok(PaginatedTools(
        total=total,
        page=page,
        page_size=page_size,
        items=[ToolListItem.from_orm_model(t) for t in tools],
    ).model_dump())


# 健康检查
@app.get("/health")
def health():
    return {"status": "ok"}


# ============ 启动 ============
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
