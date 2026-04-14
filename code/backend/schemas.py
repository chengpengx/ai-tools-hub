from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ============ 统一响应 ============
class ResponseModel(BaseModel):
    code: int = Field(default=0, description="0=成功，非0=业务错误")
    message: str = Field(default="success")
    data: Optional[object] = None


# ============ Tag ============
class TagSimple(BaseModel):
    name: str

    class Config:
        from_attributes = True


class TagWithCount(BaseModel):
    name: str
    count: int

    class Config:
        from_attributes = True


# ============ Category ============
class CategoryItem(BaseModel):
    slug: str
    name: str
    icon: str = ""
    count: int = 0

    class Config:
        from_attributes = True


# ============ Tool ============
class ToolListItem(BaseModel):
    id: int
    name: str
    summary: str
    icon_url: str = ""
    url: str
    category: str = ""
    tags: List[str] = []
    hot: int = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_model(cls, tool):
        return cls(
            id=tool.id,
            name=tool.name,
            summary=tool.summary,
            icon_url=tool.icon_url or "",
            url=tool.url,
            category=tool.category.slug if tool.category else "",
            tags=[t.name for t in tool.tags],
            hot=tool.hot,
            created_at=tool.created_at,
        )


class ToolDetail(BaseModel):
    id: int
    name: str
    summary: str
    description: str = ""
    icon_url: str = ""
    url: str
    category: str = ""
    tags: List[str] = []
    pricing: str = ""
    hot: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_model(cls, tool):
        return cls(
            id=tool.id,
            name=tool.name,
            summary=tool.summary,
            description=tool.description or "",
            icon_url=tool.icon_url or "",
            url=tool.url,
            category=tool.category.slug if tool.category else "",
            tags=[t.name for t in tool.tags],
            pricing=tool.pricing or "",
            hot=tool.hot,
            created_at=tool.created_at,
            updated_at=tool.updated_at,
        )


# ============ 分页 ============
class PaginatedTools(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ToolListItem] = []


# ============ 工具提交 ============
class ToolSubmitRequest(BaseModel):
    name: str = Field(..., description="工具名称，必填")
    url: str = Field(..., description="工具网址，必填")
    description: str = Field(default="", description="工具描述")
    category: str = Field(default="", description="所属分类")
    tags: str = Field(default="", description="标签，多个用逗号分隔")
    submitter_email: str = Field(default="", description="提交者邮箱（可选）")


class ToolSubmitResponse(BaseModel):
    id: str
