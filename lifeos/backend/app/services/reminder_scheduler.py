from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timezone
import logging

from app.database import SessionLocal
from app.models import Reminder, User
from app.services.email_service import send_reminder_email, send_morning_briefing_email
from app.services.whatsapp_service import send_reminder_notification
from app.services.ai_briefing import generate_briefing
from app.core.config import settings

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler(timezone="Africa/Lusaka")


async def process_due_reminders():
    """Run every 5 minutes: find and fire due reminders."""
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        due = db.query(Reminder).filter(
            Reminder.is_active == True,
            Reminder.sent == False,
            Reminder.scheduled_at <= now,
        ).all()

        for reminder in due:
            sent = False

            if reminder.channel in ("email", "both") and reminder.recipient_email:
                sent = send_reminder_email(
                    reminder.recipient_email,
                    reminder.title,
                    reminder.message or reminder.title,
                )

            if reminder.channel in ("whatsapp", "both") and reminder.recipient_phone:
                send_reminder_notification(
                    reminder.recipient_phone,
                    reminder.title,
                    reminder.message or reminder.title,
                    channel="whatsapp",
                )
                sent = True

            if sent:
                reminder.sent = True
                reminder.sent_at = now

                # Handle recurrence
                if reminder.recurrence == "daily":
                    from datetime import timedelta
                    next_r = reminder.scheduled_at + timedelta(days=1)
                    new_reminder = Reminder(
                        title=reminder.title,
                        message=reminder.message,
                        channel=reminder.channel,
                        recipient_email=reminder.recipient_email,
                        recipient_phone=reminder.recipient_phone,
                        scheduled_at=next_r,
                        recurrence="daily",
                        is_active=True,
                    )
                    db.add(new_reminder)
                elif reminder.recurrence == "weekly":
                    from datetime import timedelta
                    next_r = reminder.scheduled_at + timedelta(weeks=1)
                    new_reminder = Reminder(
                        title=reminder.title,
                        message=reminder.message,
                        channel=reminder.channel,
                        recipient_email=reminder.recipient_email,
                        recipient_phone=reminder.recipient_phone,
                        scheduled_at=next_r,
                        recurrence="weekly",
                        is_active=True,
                    )
                    db.add(new_reminder)

            db.commit()
            logger.info(f"Reminder fired: {reminder.title}")

    except Exception as e:
        logger.error(f"Reminder scheduler error: {e}")
    finally:
        db.close()


async def send_daily_briefing():
    """Run every morning at 06:00 Africa/Lusaka."""
    db = SessionLocal()
    try:
        briefing = generate_briefing(db)
        admin = db.query(User).filter(User.role == "admin").first()
        if admin and admin.email:
            send_morning_briefing_email(admin.email, briefing)
            logger.info(f"Daily briefing sent to {admin.email}")
    except Exception as e:
        logger.error(f"Daily briefing error: {e}")
    finally:
        db.close()


def start_scheduler():
    # Fire reminders every 5 minutes
    scheduler.add_job(
        process_due_reminders,
        "interval",
        minutes=5,
        id="reminder_processor",
        replace_existing=True,
    )
    # Morning briefing at 06:00 Lusaka time
    scheduler.add_job(
        send_daily_briefing,
        CronTrigger(hour=6, minute=0),
        id="morning_briefing",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started: reminders every 5min, briefing at 06:00 CAT")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
