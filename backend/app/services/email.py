import logging

logger = logging.getLogger(__name__)


def send_assignment_email(user_email: str, coupe_id: int):
    # Mock sending email
    logger.info(
        f"EMAIL SENT TO {user_email}: Vous avez été assigné à la coupe {coupe_id}."
    )
    print(f"EMAIL SENT TO {user_email}: Vous avez été assigné à la coupe {coupe_id}.")


def send_validation_rejected_email(user_email: str, report_id: int):
    # Mock sending email
    logger.info(
        f"EMAIL SENT TO {user_email}: Votre validation de la coupe {report_id} a été refusée par un administrateur. Veuillez compléter le formulaire avant de soumettre à nouveau."
    )
    print(
        f"EMAIL SENT TO {user_email}: Votre validation de la coupe {report_id} a été refusée par un administrateur. Veuillez compléter le formulaire avant de soumettre à nouveau."
    )


def send_reset_password_email(user_email: str, reset_token: str):
    # Mock sending email
    reset_link = f"http://localhost:8081/reset-password?token={reset_token}"
    logger.info(
        f"EMAIL SENT TO {user_email}: Lien de réinitialisation de mot de passe : {reset_link}"
    )
    print(
        f"EMAIL SENT TO {user_email}: Lien de réinitialisation de mot de passe : {reset_link}"
    )
