from app.routes.images import infer_content_type


def test_declared_allowed_type_wins() -> None:
    assert infer_content_type("photo.png", "image/jpeg") == "image/jpeg"


def test_extension_is_used_when_the_declared_type_is_unknown() -> None:
    assert infer_content_type("photo.PNG", "application/octet-stream") == "image/png"
    assert infer_content_type("photo.heic", "") == "image/jpeg"


def test_fallbacks() -> None:
    assert infer_content_type("photo", "") == "image/jpeg"
    assert infer_content_type("photo.pdf", "application/pdf") == "application/pdf"
