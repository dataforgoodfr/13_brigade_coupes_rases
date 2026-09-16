from app.schemas.hateoas import PaginationMetadataSchema


def test_first_page_has_only_next_link() -> None:
    metadata = PaginationMetadataSchema.create(
        page=0, size=10, total_count=25, url="/items"
    )

    assert metadata.pages_count == 3
    assert metadata.total_count == 25
    assert metadata.links == {
        "self": "/items?page=0&size=10",
        "next": "/items?page=1&size=10",
    }


def test_middle_page_has_both_links() -> None:
    metadata = PaginationMetadataSchema.create(
        page=1, size=10, total_count=25, url="/items"
    )

    assert metadata.links == {
        "self": "/items?page=1&size=10",
        "next": "/items?page=2&size=10",
        "previous": "/items?page=0&size=10",
    }


def test_last_page_has_only_previous_link() -> None:
    metadata = PaginationMetadataSchema.create(
        page=2, size=10, total_count=25, url="/items"
    )

    assert metadata.links == {
        "self": "/items?page=2&size=10",
        "previous": "/items?page=1&size=10",
    }


def test_exact_multiple_has_no_empty_trailing_page() -> None:
    metadata = PaginationMetadataSchema.create(
        page=1, size=10, total_count=20, url="/items"
    )

    assert metadata.pages_count == 2
    assert "next" not in metadata.links


def test_empty_result_has_no_pages() -> None:
    metadata = PaginationMetadataSchema.create(
        page=0, size=10, total_count=0, url="/items"
    )

    assert metadata.pages_count == 0
    assert metadata.links == {"self": "/items?page=0&size=10"}
