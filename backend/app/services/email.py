import logging
import smtplib
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger(__name__)


def _send(to: str, subject: str, body: str) -> None:
    """Send a plain-text email through SMTP.

    Without SMTP_HOST the message is only logged, which keeps local development
    and tests working without a mail server. Failures are logged, never raised:
    an unreachable relay must not break the request that triggered the email.
    """
    if not settings.SMTP_HOST:
        logger.info(f"EMAIL (not sent, SMTP_HOST unset) TO {to}: {subject}\n{body}")
        return

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
            if settings.SMTP_USE_TLS:
                smtp.starttls()
            if settings.SMTP_USER:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(message)
        logger.info(f"EMAIL SENT TO {to}: {subject}")
    except (smtplib.SMTPException, OSError) as e:
        logger.error(f"EMAIL FAILED TO {to}: {subject} ({e})")


def send_assignment_email(user_email: str, coupe_id: int) -> None:
    _send(
        user_email,
        "Coupe rase : vous êtes en charge d'une coupe",
        f"Vous avez été assigné à la coupe {coupe_id}.\n\n"
        f"{settings.FRONTEND_URL}/clear-cuts/{coupe_id}",
    )


def send_validation_rejected_email(user_email: str, report_id: int) -> None:
    _send(
        user_email,
        "Coupe rase : validation refusée",
        f"Votre validation de la coupe {report_id} a été refusée par un administrateur. "
        "Veuillez compléter le formulaire avant de soumettre à nouveau.\n\n"
        f"{settings.FRONTEND_URL}/clear-cuts/{report_id}",
    )


def send_reset_password_email(user_email: str, reset_token: str) -> None:
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    _send(
        user_email,
        "Coupe rase : réinitialisation de votre mot de passe",
        "Pour choisir un nouveau mot de passe, ouvrez ce lien (valable une heure) :\n\n"
        f"{reset_link}\n\n"
        "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
    )
