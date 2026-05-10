import resend
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def init_resend():
    if settings.RESEND_API_KEY:
        resend.api_key = settings.RESEND_API_KEY


def send_email(to: str, subject: str, html_body: str) -> bool:
    if not settings.RESEND_API_KEY:
        logger.warning(f"[EMAIL MOCK] To: {to} | Subject: {subject}")
        return True
    try:
        resend.Emails.send({
            "from": settings.FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html_body,
        })
        logger.info(f"Email sent to {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Email failed to {to}: {e}")
        return False


def send_reminder_email(to: str, title: str, message: str) -> bool:
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: 'DM Sans', Arial, sans-serif; background: #0D1017; color: #F5F0E8; padding: 40px; max-width: 600px; margin: 0 auto;">
      <div style="background: #111318; border: 1px solid #2A2D35; border-radius: 16px; padding: 32px;">
        <div style="color: #C49E52; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 8px;">
          LifeOS · Nexus Digital Solutions
        </div>
        <h2 style="color: #F5F0E8; font-size: 22px; margin: 0 0 20px;">{title}</h2>
        <div style="color: #D1D5DB; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">{message}</div>
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #2A2D35; color: #6B7280; font-size: 12px;">
          LifeOS Operations Platform · Nexus Digital Solutions
        </div>
      </div>
    </body>
    </html>
    """
    return send_email(to, f"LifeOS Reminder: {title}", html)


def send_morning_briefing_email(to: str, briefing_text: str) -> bool:
    import markdown
    html_content = markdown.convert(briefing_text) if hasattr(markdown, 'convert') else f"<pre>{briefing_text}</pre>"
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: 'DM Sans', Arial, sans-serif; background: #0D1017; color: #F5F0E8; padding: 40px; max-width: 600px; margin: 0 auto;">
      <div style="background: #111318; border: 1px solid #2A2D35; border-radius: 16px; padding: 32px;">
        <div style="color: #C49E52; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 8px;">
          Morning Briefing
        </div>
        <h2 style="color: #F5F0E8; font-size: 22px; margin: 0 0 24px; font-style: italic;">Good morning, Siddhartha.</h2>
        <div style="color: #D1D5DB; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">{briefing_text}</div>
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #2A2D35; color: #6B7280; font-size: 12px;">
          LifeOS · Nexus Digital Solutions · PACRA Reg: 320261069474
        </div>
      </div>
    </body>
    </html>
    """
    return send_email(to, "LifeOS Morning Briefing", html)
