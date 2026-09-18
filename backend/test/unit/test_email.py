import smtplib
from email.message import EmailMessage
from typing import Any

import pytest

from app.config import settings
from app.services import email


class FakeSMTP:
    sent: list[EmailMessage] = []
    logins: list[tuple[str, str]] = []
    starttls_calls = 0

    def __init__(self, host: str, port: int, timeout: float) -> None:
        self.host = host
        self.port = port

    def __enter__(self) -> FakeSMTP:
        return self

    def __exit__(self, *args: Any) -> None:
        pass

    def starttls(self) -> None:
        FakeSMTP.starttls_calls += 1

    def login(self, user: str, password: str) -> None:
        FakeSMTP.logins.append((user, password))

    def send_message(self, message: EmailMessage) -> None:
        FakeSMTP.sent.append(message)


@pytest.fixture
def smtp(monkeypatch: pytest.MonkeyPatch) -> type[FakeSMTP]:
    FakeSMTP.sent = []
    FakeSMTP.logins = []
    FakeSMTP.starttls_calls = 0
    monkeypatch.setattr(smtplib, "SMTP", FakeSMTP)
    monkeypatch.setattr(settings, "SMTP_HOST", "mail.example.org")
    monkeypatch.setattr(settings, "SMTP_FROM", "Brigade <no-reply@example.org>")
    monkeypatch.setattr(settings, "FRONTEND_URL", "https://front.example.org")
    return FakeSMTP


def test_without_smtp_host_nothing_is_sent(
    monkeypatch: pytest.MonkeyPatch, smtp: type[FakeSMTP]
) -> None:
    monkeypatch.setattr(settings, "SMTP_HOST", "")

    email.send_assignment_email("alice@example.com", 12)

    assert smtp.sent == []


def test_reset_password_email_links_to_the_frontend(smtp: type[FakeSMTP]) -> None:
    email.send_reset_password_email("alice@example.com", "tok3n")

    (message,) = smtp.sent
    assert message["To"] == "alice@example.com"
    assert message["From"] == "Brigade <no-reply@example.org>"
    assert (
        "https://front.example.org/reset-password?token=tok3n" in message.get_content()
    )


def test_starttls_and_login_follow_the_settings(
    monkeypatch: pytest.MonkeyPatch, smtp: type[FakeSMTP]
) -> None:
    monkeypatch.setattr(settings, "SMTP_USE_TLS", True)
    monkeypatch.setattr(settings, "SMTP_USER", "user")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "secret")

    email.send_validation_rejected_email("alice@example.com", 7)

    assert smtp.starttls_calls == 1
    assert smtp.logins == [("user", "secret")]

    monkeypatch.setattr(settings, "SMTP_USE_TLS", False)
    monkeypatch.setattr(settings, "SMTP_USER", "")

    email.send_validation_rejected_email("alice@example.com", 7)

    assert smtp.starttls_calls == 1
    assert smtp.logins == [("user", "secret")]


def test_smtp_failure_is_logged_not_raised(
    monkeypatch: pytest.MonkeyPatch, smtp: type[FakeSMTP]
) -> None:
    def failing_send(self: FakeSMTP, message: EmailMessage) -> None:
        raise smtplib.SMTPServerDisconnected("gone")

    monkeypatch.setattr(FakeSMTP, "send_message", failing_send)

    email.send_assignment_email("alice@example.com", 12)
