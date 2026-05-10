from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ✅ Relative import for briefing schemas
from .briefing import BriefingRequest, BriefingOut

# ── Auth ──────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserOut"


class RefreshRequest(BaseModel):
    refresh_token: str


# ── User ──────────────────────────────────────────────────────────────────────
class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str
    phone: Optional[str]
    is_active: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None


# ── Project ───────────────────────────────────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str
    owner: Optional[str] = None
    category: Optional[str] = "startup"
    color: Optional[str] = "#4ECDC4"
    status: Optional[str] = "active"
    urgency: Optional[str] = "medium"
    blockers: Optional[str] = None
    next_action: Optional[str] = None
    description: Optional[str] = None


class ProjectUpdate(ProjectCreate):
    name: Optional[str] = None


class ProjectOut(BaseModel):
    id: int
    name: str
    owner: Optional[str]
    category: Optional[str]
    color: Optional[str]
    status: str
    urgency: str
    blockers: Optional[str]
    next_action: Optional[str]
    description: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Personnel ─────────────────────────────────────────────────────────────────
class PersonnelCreate(BaseModel):
    full_name: str
    role: Optional[str] = None
    area: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    reports_to: Optional[str] = None
    availability: Optional[str] = None
    status: Optional[str] = "active"
    projects: Optional[str] = None
    pending_deliverables: Optional[str] = None
    contract_status: Optional[str] = None
    salary_notes: Optional[str] = None
    reliability_notes: Optional[str] = None
    notes: Optional[str] = None


class PersonnelUpdate(PersonnelCreate):
    full_name: Optional[str] = None


class PersonnelOut(BaseModel):
    id: int
    full_name: str
    role: Optional[str]
    area: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    reports_to: Optional[str]
    availability: Optional[str]
    status: str
    projects: Optional[str]
    pending_deliverables: Optional[str]
    contract_status: Optional[str]
    salary_notes: Optional[str]
    reliability_notes: Optional[str]
    notes: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── FollowUp ──────────────────────────────────────────────────────────────────
class FollowUpCreate(BaseModel):
    item: str
    owner: Optional[str] = None
    priority: Optional[str] = "high"
    due_date: Optional[str] = None
    project_id: Optional[int] = None
    notes: Optional[str] = None


class FollowUpUpdate(FollowUpCreate):
    item: Optional[str] = None
    done: Optional[bool] = None


class FollowUpOut(BaseModel):
    id: int
    item: str
    owner: Optional[str]
    priority: str
    due_date: Optional[str]
    done: bool
    done_at: Optional[datetime]
    project_id: Optional[int]
    notes: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Reminder ──────────────────────────────────────────────────────────────────
class ReminderCreate(BaseModel):
    title: str
    message: Optional[str] = None
    channel: Optional[str] = "email"
    recipient_email: Optional[str] = None
    recipient_phone: Optional[str] = None
    scheduled_at: datetime
    recurrence: Optional[str] = "none"


class ReminderUpdate(ReminderCreate):
    title: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    is_active: Optional[bool] = None


class ReminderOut(BaseModel):
    id: int
    title: str
    message: Optional[str]
    channel: str
    recipient_email: Optional[str]
    recipient_phone: Optional[str]
    scheduled_at: datetime
    sent: bool
    sent_at: Optional[datetime]
    recurrence: Optional[str]
    is_active: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True