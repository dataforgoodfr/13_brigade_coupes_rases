import pytest
from common.clear_cut import new_clear_cut_report


def test_clear_cut_creation(db):
    clear_cut = new_clear_cut_report()
    db.add(clear_cut)
    db.commit()

    with pytest.raises(ValueError) as exc_info:
        new_clear_cut_report(status="invalid_status")
    assert str(exc_info.value) == "Status must be one of: pending, validated"

    assert clear_cut.id is not None
    assert clear_cut.created_at is not None
