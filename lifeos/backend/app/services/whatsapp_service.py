import africastalking
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

_at_initialized = False


def init_at():
    global _at_initialized
    if settings.AT_USERNAME and settings.AT_API_KEY and not _at_initialized:
        africastalking.initialize(settings.AT_USERNAME, settings.AT_API_KEY)
        _at_initialized = True


def send_sms(phone: str, message: str) -> bool:
    if not settings.AT_API_KEY:
        logger.warning(f"[SMS MOCK] To: {phone} | {message[:60]}...")
        return True
    try:
        init_at()
        sms = africastalking.SMS
        # Normalize phone number to E.164
        if not phone.startswith("+"):
            phone = f"+{phone}"
        response = sms.send(message, [phone], sender_id=settings.AT_SENDER_ID)
        logger.info(f"SMS sent to {phone}: {response}")
        return True
    except Exception as e:
        logger.error(f"SMS failed to {phone}: {e}")
        return False


def send_whatsapp(phone: str, message: str) -> bool:
    """
    Africa's Talking WhatsApp API (Business API tier).
    Falls back to SMS if WhatsApp not configured.
    """
    if not settings.AT_API_KEY:
        logger.warning(f"[WHATSAPP MOCK] To: {phone} | {message[:60]}...")
        return True
    try:
        init_at()
        # AT WhatsApp uses the same SMS gateway with WhatsApp channel
        # For full WA Business API, configure via AT dashboard
        return send_sms(phone, f"[LifeOS] {message}")
    except Exception as e:
        logger.error(f"WhatsApp failed to {phone}: {e}")
        return False


def send_reminder_notification(phone: str, title: str, message: str, channel: str = "sms") -> bool:
    text = f"LifeOS Reminder\n{title}\n\n{message}"
    if channel == "whatsapp":
        return send_whatsapp(phone, text)
    return send_sms(phone, text)
