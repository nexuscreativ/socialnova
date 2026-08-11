"""
SocialNova API - Email service.

Sends email via aiosmtplib when SMTP is configured; otherwise logs the message
to the console. Every function is a non-failing no-op on any error, so callers
never see a 500 from email delivery.
"""
import html
import logging
from typing import Optional
from urllib.parse import urlencode

from config import settings

logger = logging.getLogger("socialnova.email")

# ─── Optional import ────────────────────────────────────────────────────────

try:
    import aiosmtplib

    SMTP_AVAILABLE = True
except Exception:  # pragma: no cover - aiosmtplib not installed
    SMTP_AVAILABLE = False
    aiosmtplib = None


# ─── SMTP availability ──────────────────────────────────────────────────────

def smtp_configured() -> bool:
    """True when SMTP settings are present and aiosmtplib is importable."""
    return bool(settings.SMTP_HOST and SMTP_AVAILABLE)


# ─── Core sender ────────────────────────────────────────────────────────────

async def send_email(
    to: str,
    subject: str,
    body_html: str,
    body_text: Optional[str] = None,
) -> bool:
    """Send a single HTML email.

    Falls back to console logging when SMTP is unconfigured or the send fails.
    Always returns True on success (or when only logging), False on failure.
    """
    try:
        from email.message import EmailMessage

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to
        msg.set_content(body_text or html_to_text(body_html))
        msg.add_alternative(body_html, subtype="html")

        if not smtp_configured():
            logger.info(
                "email.skipped_smtp_unconfigured",
                extra={
                    "extra_data": {
                        "to": to,
                        "subject": subject,
                        "body_html_preview": body_html[:200],
                    }
                },
            )
            return True

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            use_tls=settings.SMTP_USE_TLS,
            timeout=15,
        )
        logger.info(
            "email.sent",
            extra={"extra_data": {"to": to, "subject": subject}},
        )
        return True
    except Exception as exc:
        logger.warning(
            "email.send_failed",
            extra={"extra_data": {"to": to, "subject": subject, "error": str(exc)}},
        )
        return False


def html_to_text(html_body: str) -> str:
    """Crude HTML -> text conversion for plain-text email parts."""
    import re

    text = re.sub(r"<[^>]+>", "", html_body)
    return html.unescape(text).strip()


# ─── Templates ──────────────────────────────────────────────────────────────

def _branded_html(title: str, body_html: str) -> str:
    return f"""\
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6eaf2;">
        <tr><td style="background:#4f46e5;padding:20px 32px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;">SocialNova</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;color:#111827;font-size:20px;">{title}</h1>
          <div style="color:#374151;font-size:15px;line-height:1.6;">{body_html}</div>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#f9fafb;color:#6b7280;font-size:12px;text-align:center;">
          &copy; {settings.APP_NAME} &middot; You are receiving this email because of your SocialNova account.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def verification_link(token: str) -> str:
    return f"{settings.APP_URL}/verify-email?{urlencode({'token': token})}"


def reset_link(token: str) -> str:
    return f"{settings.APP_URL}/reset-password?{urlencode({'token': token})}"


# ─── High-level helpers ─────────────────────────────────────────────────────

async def send_verification_email(user, token: str) -> bool:
    """Send an email-verification message (never raises)."""
    name = getattr(user, "name", None) or "there"
    title = "Verify your email address"
    body = f"""\
<p>Hi {html.escape(name)},</p>
<p>Welcome to {html.escape(settings.APP_NAME)}! Please verify your email address to
unlock all agent features.</p>
<p style="margin:24px 0;">
  <a href="{verification_link(token)}" style="background:#4f46e5;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
    Verify Email
  </a>
</p>
<p style="color:#6b7280;font-size:13px;">If the button does not work, copy this link:<br>
{html.escape(verification_link(token))}</p>
<p>This link expires in 24 hours.</p>"""
    return await send_email(user.email, title, _branded_html(title, body))


async def send_password_reset_email(user, token: str) -> bool:
    """Send a password-reset message (never raises)."""
    name = getattr(user, "name", None) or "there"
    title = "Reset your password"
    body = f"""\
<p>Hi {html.escape(name)},</p>
<p>We received a request to reset your password. Click below to choose a new one:</p>
<p style="margin:24px 0;">
  <a href="{reset_link(token)}" style="background:#4f46e5;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
    Reset Password
  </a>
</p>
<p style="color:#6b7280;font-size:13px;">If you did not request this, you can safely ignore this email.
This link expires in 1 hour.</p>"""
    return await send_email(user.email, title, _branded_html(title, body))