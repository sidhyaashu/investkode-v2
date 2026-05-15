import smtplib
import asyncio
from email.mime.text import MIMEText
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, body: str):
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.send_message(msg)
            logger.info(f"Email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")


async def send_email_otp(email: str, otp: str):
    # wrapper for OTP
    await asyncio.to_thread(
        send_email,
        to_email=email,
        subject="Your InvestKode OTP",
        body=f"Your One-Time Password is: {otp}. It will expire in 5 minutes."
    )
