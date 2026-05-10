"""
AI Briefing Router — LifeOS API
"""
from fastapi import APIRouter, Depends
from datetime import datetime

from app.schemas.briefing import BriefingRequest, BriefingOut
from app.core.security import get_current_user

router = APIRouter(prefix="/briefing", tags=["briefing"])


def _build_auto_context(user) -> str:
    """
    Build a context string from the authenticated User ORM object.
    `user` is a SQLAlchemy model instance — use attribute access, not .get().
    Extend to pull live projects/follow-ups from DB when ready.
    """
    name = getattr(user, "full_name", None) or getattr(user, "email", "Slam")
    return (
        f"User: {name}\n"
        "Projects: ZamPOS (merchant onboarding), AgriHub (forecasting), LifeOS (ops).\n"
        "Pull today's priorities, blockers, and quick wins from active context."
    )


@router.post("/", response_model=BriefingOut)
async def generate_briefing(
    request: BriefingRequest,
    current_user=Depends(get_current_user),  # ORM object, NOT dict
):
    """
    Generate an AI-powered operational briefing.

    POST /api/v1/briefing/
    Body: {} or { "context": "..." }  — context is optional.
    """
    context = request.context or _build_auto_context(current_user)

    # 🧠 TODO: Wire up Ollama / OpenAI / Anthropic here
    name = getattr(current_user, "full_name", None) or getattr(current_user, "email", "Slam")
    first_name = name.split()[0].upper() if name else "SLAM"

    briefing_text = (
        f"🌅 GOOD MORNING, {first_name}\n\n"
        f"🔥 TOP 3 PRIORITIES\n"
        f"• ZamPOS — merchant onboarding pipeline\n"
        f"• AgriHub — forecasting model review\n"
        f"• LifeOS — ops dashboard live\n\n"
        f"📋 CONTEXT\n{context[:300]}"
    )

    return BriefingOut(
        briefing=briefing_text,
        model="qwen:4b",
        generated_at=datetime.now(),
    )


@router.get("/template")
async def get_briefing_template():
    """Return the prompt template used for briefing generation."""
    return {
        "template": (
            "You are Slam's AI Operations Chief. Generate a concise morning briefing covering:\n"
            "1. Top 3 priorities (ZamPOS, AgriHub, LifeOS)\n"
            "2. Critical follow-ups (Robert/Nyimbo, Austin/Align, Kapula/TrueZed)\n"
            "3. Blockers needing attention\n"
            "4. Quick wins (<15 min tasks)\n\n"
            "Tone: Direct, energetic, actionable. Use emojis sparingly.\n"
            "Context: {context}"
        )
    }