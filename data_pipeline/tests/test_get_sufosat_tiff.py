from pathlib import Path

import numpy as np
import rasterio
from rasterio.transform import from_origin

from pipeline.scripts.get_sufosat_tiff import merge_tiles, tile_grid


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
