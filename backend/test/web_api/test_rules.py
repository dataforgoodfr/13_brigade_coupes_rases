from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from test.common.user import get_admin_user_token


def test_get_rules(client: TestClient) -> None:
    response = client.get("api/v1/rules/")
    assert response.status_code == status.HTTP_200_OK


def test_update_rules(client: TestClient, db: Session) -> None:
    token = get_admin_user_token(client, db)[1]

    response = client.put(
        "api/v1/rules/1",
        json={"threshold": 42, "ecological_zonings_ids": ["1"]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT


def test_update_rules_batch_recomputes_reports(
    client: TestClient, db: Session
) -> None:
    # Abaisser le seuil de surface via l'endpoint groupé doit être répercuté
    # sur les signalements existants.
    token = get_admin_user_token(client, db)[1]
    rules = client.get("api/v1/rules").json()
    area_rule = next(rule for rule in rules if rule["type"] == "area")
    before = {
        report["id"]: set(report["rulesIds"])
        for report in client.get("api/v1/clear-cuts-reports?size=100").json()[
            "content"
        ]
    }

    response = client.put(
        "api/v1/rules",
        json={
            "rules": [
                {
                    "id": area_rule["id"],
                    "threshold": 0.01,
                    "ecological_zonings_ids": [],
                }
            ]
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    after = {
        report["id"]: set(report["rulesIds"])
        for report in client.get("api/v1/clear-cuts-reports?size=100").json()[
            "content"
        ]
    }
    newly_matched = [
        report_id
        for report_id in before
        if area_rule["id"] in after[report_id]
        and area_rule["id"] not in before[report_id]
    ]
    assert newly_matched
