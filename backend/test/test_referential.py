def test_get_referential(client):
    response = client.get("/api/v1/referential/")

    assert response.status_code == 200
    data = response.json()
    assert data["departments"] is not None
    assert data["ecological_zonings"] is not None
    assert data["tags"] is not None
