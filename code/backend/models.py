from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Table,
    Index,
)
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base

# 中间表：工具-标签多对多关联
tool_tags = Table(
    "tool_tags",
    Base.metadata,
    Column("tool_id", Integer, ForeignKey("tools.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
    Index("idx_tag_id", "tag_id"),
)


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(50), nullable=False)
    icon = Column(String(10), default="")
    sort_order = Column(Integer, default=0)

    tools = relationship("Tool", back_populates="category")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)

    tools = relationship("Tool", secondary=tool_tags, back_populates="tags")


class Tool(Base):
    __tablename__ = "tools"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    summary = Column(String(255), nullable=False)
    description = Column(Text, default="")
    icon_url = Column(String(500), default="")
    url = Column(String(500), nullable=False)
    category_slug = Column(
        String(50), ForeignKey("categories.slug"), nullable=False, index=True
    )
    pricing = Column(String(255), default="")
    hot = Column(Integer, default=0, index=True)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="tools")
    tags = relationship("Tag", secondary=tool_tags, back_populates="tools")


class ToolSubmission(Base):
    """用户提交的工具审核表"""
    __tablename__ = "tool_submissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    url = Column(String(500), nullable=False)
    description = Column(Text, default="")
    category = Column(String(50), default="")
    tags = Column(String(500), default="")
    submitter_email = Column(String(255), default="")
    status = Column(String(20), default="pending", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
