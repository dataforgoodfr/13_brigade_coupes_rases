from pathlib import Path
from typing import Any

import numpy as np
import pytest
import rasterio
import requests
import responses
from rasterio.transform import from_origin

from pipeline.scripts import get_sufosat_tiff
from pipeline.scripts.get_sufosat_tiff import download_tile, merge_tiles, tile_grid


class FakeImage:
    """Image Earth Engine qui délivre une URL neuve à chaque getDownloadURL."""

    def __init__(self) -> None:
        self.urls_given = 0

    def toInt16(self) -> FakeImage:  # noqa: N802
        return self

    def unmask(self, _value: int) -> FakeImage:
        return self

    def getDownloadURL(self, _params: dict[str, Any]) -> str:  # noqa: N802
        self.urls_given += 1
        return f"https://ee.test/tile/{self.urls_given}"


def test_tile_grid_covers_bounds_with_clipped_edges() -> None:
    tiles = tile_grid((0, 0, 100, 70), 40)

    assert len(tiles) == 3 * 2
    assert tiles[0] == (0, 0, 40, 40)
    # Dernière colonne et dernière ligne rognées aux bornes.
    assert tiles[-1] == (80, 40, 100, 70)


def test_merge_tiles_assembles_a_mosaic_with_nodata(tmp_path: Path) -> None:
    def write(path: Path, x0: int, y0: int, value: int) -> None:
        data = np.full((1, 10, 10), value, dtype="int16")
        with rasterio.open(
            path,
            "w",
            driver="GTiff",
            height=10,
            width=10,
            count=1,
            dtype="int16",
            crs="EPSG:3035",
            transform=from_origin(x0, y0, 10, 10),
            nodata=0,
        ) as dst:
            dst.write(data)

    write(tmp_path / "a.tif", 0, 100, 7)
    write(tmp_path / "b.tif", 100, 100, 9)  # à droite de a
    output = tmp_path / "merged.tif"

    merge_tiles([tmp_path / "a.tif", tmp_path / "b.tif"], output)

    with rasterio.open(output) as src:
        assert (src.width, src.height) == (20, 10)
        band = src.read(1)
        assert band[0, 0] == 7 and band[0, 19] == 9
        assert src.nodata == 0
        assert src.profile["compress"] == "deflate"


@responses.activate
def test_download_tile_writes_the_file_only_once_complete(tmp_path: Path) -> None:
    responses.get("https://ee.test/tile/1", body=b"tiff bytes")
    tile_path = tmp_path / "tile_0001.tif"

    download_tile(FakeImage(), None, tile_path)  # type: ignore[arg-type]

    assert tile_path.read_bytes() == b"tiff bytes"
    assert not tile_path.with_suffix(".part").exists()


@responses.activate
def test_download_tile_failure_leaves_no_tile_for_resume(tmp_path: Path) -> None:
    responses.get("https://ee.test/tile/1", status=401)
    tile_path = tmp_path / "tile_0001.tif"

    with pytest.raises(requests.HTTPError):
        download_tile(FakeImage(), None, tile_path)  # type: ignore[arg-type]

    assert not tile_path.exists()


@responses.activate
def test_download_tile_gives_up_past_the_deadline(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    responses.get("https://ee.test/tile/1", body=b"x" * (3 << 20))
    monkeypatch.setattr(get_sufosat_tiff, "DOWNLOAD_TILE_TIMEOUT_SECONDS", -1)
    tile_path = tmp_path / "tile_0001.tif"

    with pytest.raises(TimeoutError):
        download_tile(FakeImage(), None, tile_path)  # type: ignore[arg-type]

    assert not tile_path.exists()


def test_each_attempt_asks_for_a_fresh_url(tmp_path: Path) -> None:
    image = FakeImage()
    with responses.RequestsMock() as mocked:
        mocked.get("https://ee.test/tile/1", status=401)
        mocked.get("https://ee.test/tile/2", body=b"ok")
        with pytest.raises(requests.HTTPError):
            download_tile(image, None, tmp_path / "t.tif")  # type: ignore[arg-type]
        download_tile(image, None, tmp_path / "t.tif")  # type: ignore[arg-type]

    assert image.urls_given == 2
    assert (tmp_path / "t.tif").read_bytes() == b"ok"
