from app.services.idempotency import request_fingerprint


def test_fingerprint_ignores_key_order() -> None:
    assert request_fingerprint(1, {"a": 1, "b": [1, 2]}) == request_fingerprint(
        1, {"b": [1, 2], "a": 1}
    )


def test_fingerprint_depends_on_every_part() -> None:
    base = request_fingerprint("form", 1, 2, None, {"weather": "pluie"})
    assert base != request_fingerprint("form", 3, 2, None, {"weather": "pluie"})
    assert base != request_fingerprint("form", 1, 2, "123.4", {"weather": "pluie"})
    assert base != request_fingerprint("form", 1, 2, None, {"weather": "soleil"})
