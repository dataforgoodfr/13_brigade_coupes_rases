from datetime import datetime

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


def test_get_clearcuts_map_sorted_by_first_cut_date(client, db):
    # status "validated" so the reports pass the relevance filter;
    # extreme dates so ordering is deterministic whatever the seeded data
    oldest = new_clear_cut_report(status="validated")
    oldest.first_cut_date = datetime(1900, 1, 1)
    oldest.clear_cuts[0].observation_start_date = datetime(1900, 1, 1)
    newest = new_clear_cut_report(status="validated")
    newest.first_cut_date = datetime(2999, 1, 1)
    newest.clear_cuts[0].observation_start_date = datetime(2999, 1, 1)
    db.add_all([oldest, newest])
    db.commit()
    oldest_id, newest_id = str(oldest.id), str(newest.id)

    desc = client.get("/api/v1/clear-cuts-map?sortBy=first_cut_date&sortOrder=desc")
    assert desc.status_code == 200
    assert desc.json()["previews"][0]["id"] == newest_id

    asc = client.get("/api/v1/clear-cuts-map?sortBy=first_cut_date&sortOrder=asc")
    assert asc.status_code == 200
    assert asc.json()["previews"][0]["id"] == oldest_id
