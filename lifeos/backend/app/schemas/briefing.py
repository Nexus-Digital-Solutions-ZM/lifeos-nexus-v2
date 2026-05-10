"""
Pydantic schemas for AI Briefing endpoints
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class BriefingRequest(BaseModel):
    """Request body for generating a briefing.

    `context` is optional — when omitted the backend auto-builds it from
    live projects/follow-ups data. Clients may supply extra context to
    enrich the briefing.
    """
    context: Optional[str] = Field(
        default=None,
        max_length=5000,
        description="Optional extra context. If None, backend builds context automatically.",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "context": "Projects: ZamPOS merchant onboarding (3 pending). Follow-ups: Robert on Nyimbo demo."
            }
        }


class BriefingOut(BaseModel):
    """Response body for generated briefing"""
    briefing: str = Field(..., description="The AI-generated morning briefing text")
    model: str = Field(default="qwen:4b", description="LLM model used for generation")
    generated_at: datetime = Field(
        default_factory=datetime.now,
        description="Timestamp when briefing was generated",
    )

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "briefing": "🌅 GOOD MORNING, SLAM\n\n🔥 TOP 3 PRIORITIES TODAY\n• ...",
                "model": "qwen:4b",
                "generated_at": "2026-05-10T08:00:00",
            }
        }