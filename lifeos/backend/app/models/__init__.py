from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UrgencyLevel(str, enum.Enum):
    critical = "critical"
    urgent = "urgent"
    high = "high"
    medium = "medium"
    low = "low"


class ProjectStatus(str, enum.Enum):
    active = "active"
    pending = "pending"
    blocked = "blocked"
    done = "done"
    archived = "archived"


class PersonnelStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    onboarding = "onboarding"


class FollowUpPriority(str, enum.Enum):
    critical = "critical"
    urgent = "urgent"
    high = "high"
    medium = "medium"
    low = "low"


# ── User ─────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(String(50), default="member")  # admin | member
    phone = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# ── Project ───────────────────────────────────────────────────────────────────
class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    owner = Column(String(255))
    category = Column(String(100))
    color = Column(String(20), default="#4ECDC4")
    status = Column(String(50), default="active")
    urgency = Column(String(50), default="medium")
    blockers = Column(Text)
    next_action = Column(Text)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    followups = relationship("FollowUp", back_populates="project", cascade="all, delete-orphan")


# ── Personnel ─────────────────────────────────────────────────────────────────
class Personnel(Base):
    __tablename__ = "personnel"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    role = Column(String(255))
    area = Column(String(255))
    phone = Column(String(100))
    email = Column(String(255))
    reports_to = Column(String(255))
    availability = Column(String(255))
    status = Column(String(50), default="active")
    projects = Column(Text)          # comma-separated project names
    pending_deliverables = Column(Text)
    contract_status = Column(String(100))
    salary_notes = Column(Text)
    reliability_notes = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# ── FollowUp ──────────────────────────────────────────────────────────────────
class FollowUp(Base):
    __tablename__ = "followups"

    id = Column(Integer, primary_key=True, index=True)
    item = Column(Text, nullable=False)
    owner = Column(String(255))
    priority = Column(String(50), default="high")
    due_date = Column(String(20))    # ISO date string YYYY-MM-DD
    done = Column(Boolean, default=False)
    done_at = Column(DateTime(timezone=True))
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", back_populates="followups")


# ── Reminder ──────────────────────────────────────────────────────────────────
class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text)
    channel = Column(String(50), default="email")   # email | whatsapp | both
    recipient_email = Column(String(255))
    recipient_phone = Column(String(100))
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    sent = Column(Boolean, default=False)
    sent_at = Column(DateTime(timezone=True))
    recurrence = Column(String(50))   # none | daily | weekly
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
