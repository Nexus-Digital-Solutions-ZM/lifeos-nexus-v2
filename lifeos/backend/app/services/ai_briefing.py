# backend/app/services/ai_briefing.py
"""
AI Briefing Service — Ollama + Qwen Integration
Replaces Anthropic/Claude with local LLM
"""
import httpx
import logging
from datetime import datetime
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class OllamaBriefingService:
    """Generate morning briefings using local Ollama + Qwen"""
    
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip('/')
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT
    
    async def generate_briefing(
        self, 
        context: str, 
        user_name: Optional[str] = None
    ) -> str:
        """
        Generate AI morning briefing using local Qwen model.
        
        Args:
            context: Summary of projects, follow-ups, reminders
            user_name: Optional name for personalization
            
        Returns:
            Formatted briefing text
        """
        display_name = user_name or "Slam"
        
        prompt = f"""You are LifeOS, the executive AI assistant for {display_name}, a high-velocity entrepreneur running Nexus Digital Solutions in Zambia.

Generate a concise, actionable morning briefing (max 250 words) based on this operational context:

{context}

STRUCTURE YOUR RESPONSE EXACTLY AS FOLLOWS:

🌅 GOOD MORNING, {display_name.upper()}
[One encouraging opening sentence]

🔥 TOP 3 PRIORITIES TODAY
• [Priority 1 with specific action]
• [Priority 2 with specific action]  
• [Priority 3 with specific action]

⚠️ BLOCKERS NEEDING ATTENTION
• [Blocker 1 + suggested next step]
• [Blocker 2 + suggested next step] (or "None — clear to execute")

👥 KEY FOLLOW-UPS
• [Person/Project]: [What + when]
• [Person/Project]: [What + when]

💡 STRATEGIC INSIGHT
[One sentence connecting today's work to bigger goals]

— 
LifeOS • {datetime.now().strftime('%d %b %Y')} • CAT

Keep it direct, practical, and focused on execution. No fluff."""

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": [
                            {
                                "role": "system", 
                                "content": "You are LifeOS, a concise executive assistant for entrepreneurs. Always format responses with clear sections using emojis. Never exceed 300 words."
                            },
                            {"role": "user", "content": prompt}
                        ],
                        "stream": False,
                        "options": {
                            "temperature": 0.3,
                            "top_p": 0.9,
                            "num_predict": 600
                        }
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                content = result.get("message", {}).get("content", "")
                if not content:
                    logger.warning("Ollama returned empty response")
                    return self._fallback_briefing(display_name)
                    
                return content.strip()
                
        except httpx.ConnectError:
            logger.error(f"Cannot connect to Ollama at {self.base_url}")
            return self._fallback_briefing(display_name, "Ollama service unreachable")
        except httpx.TimeoutException:
            logger.error(f"Ollama request timed out ({self.timeout}s)")
            return self._fallback_briefing(display_name, "Request timed out")
        except Exception as e:
            logger.error(f"Ollama briefing generation failed: {e}")
            return self._fallback_briefing(display_name, str(e))
    
    def _fallback_briefing(self, name: str, error: Optional[str] = None) -> str:
        """Return a safe fallback when AI is unavailable"""
        error_note = f"\n⚠️ AI temporarily unavailable: {error}" if error else ""
        return f"""🌅 GOOD MORNING, {name.upper()}

🔥 TOP 3 PRIORITIES TODAY
• Review your project dashboard for overdue items
• Check follow-ups board for pending responses
• Schedule 2 high-impact deep work blocks

⚠️ BLOCKERS NEEDING ATTENTION
• Verify all critical paths are unblocked

👥 KEY FOLLOW-UPS
• Team: Sync on deliverables due this week

💡 STRATEGIC INSIGHT
Focus on completion over perfection today.

— 
LifeOS • {datetime.now().strftime('%d %b %Y')} • CAT{error_note}"""
    
    async def health_check(self) -> dict:
        """Verify Ollama is running and model is available"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                # Check Ollama API is up
                r = await client.get(f"{self.base_url}/api/tags")
                if r.status_code != 200:
                    return {"status": "error", "message": "Ollama API unreachable"}
                
                # Check our model is loaded
                models = r.json().get("models", [])
                model_names = [m.get("name", "") for m in models]
                
                if not any(self.model in name for name in model_names):
                    return {
                        "status": "warning", 
                        "message": f"Model '{self.model}' not found. Available: {model_names[:5]}",
                        "suggestion": f"Run: ollama pull {self.model}"
                    }
                
                return {"status": "ok", "model": self.model, "models_loaded": len(model_names)}
                
        except Exception as e:
            return {"status": "error", "message": str(e)}


# Singleton instance for easy import
_briefing_service: Optional[OllamaBriefingService] = None

def get_briefing_service() -> OllamaBriefingService:
    """Get or create the briefing service singleton"""
    global _briefing_service
    if _briefing_service is None:
        _briefing_service = OllamaBriefingService()
    return _briefing_service


# Legacy function for backward compatibility
async def generate_briefing(context: str, user_name: Optional[str] = None) -> str:
    """Legacy wrapper — use OllamaBriefingService directly for new code"""
    service = get_briefing_service()
    return await service.generate_briefing(context, user_name)