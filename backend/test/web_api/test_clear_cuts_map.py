from test.common.clear_cut import new_clear_cut_report


def test_get_clearcuts_map(client, db):
    clear_cut = new_clear_cut_report()
    db.add(clear_cut)
    db.commit()

    response = client.get(
        "/api/v1/clear-cuts-map?sw_lat=47.49308072945064&sw_lng=-1.0766601562500002&ne_lat=49.79899569636492&ne_lng=4.051208496093751&cut_years=2025"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["previews"] is not None
    assert data["points"] is not None
