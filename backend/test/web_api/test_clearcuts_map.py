from common.clear_cut import new_clear_cut


def test_get_clearcuts_map(client, db):
    clear_cut = new_clear_cut()
    db.add(clear_cut)
    db.commit()

    response = client.get(
        "/api/v1/clearcuts-map?swLat=47.49308072945064&swLng=-1.0766601562500002&neLat=49.79899569636492&neLng=4.051208496093751&cutYears=2025"
    )
    assert response.status_code == 200
    data = response.json()
    print(f"{data}")
    assert data["previews"] is not None
    assert data["points"] is not None
