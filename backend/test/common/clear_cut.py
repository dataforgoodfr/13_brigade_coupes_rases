from datetime import datetime, timedelta

from geoalchemy2 import WKTElement
from geoalchemy2.shape import from_shape
from app.models import (
    SRID,
    ClearCut,
    ClearCutEcologicalZoning,
    ClearCutReport,
    EcologicalZoning,
)
from shapely.geometry import Point, MultiPolygon


def new_clear_cut_report(
    status: str = "to_validate", city_id: int = 31482, ecological_zoning_id=1
):
    return ClearCutReport(
        slope_area_ratio_percentage=15.5,
        city_id=city_id,
        status=status,
        clear_cuts=[
            ClearCut(
                observation_start_date=datetime.now() - timedelta(days=10),
                observation_end_date=datetime.now() - timedelta(days=5),
                area_hectare=10,
                location=from_shape(Point(2.380192, 48.878899), srid=SRID),
                boundary=from_shape(
                    MultiPolygon(
                        [
                            (
                                [
                                    (2.381136, 48.881707),
                                    (2.379699, 48.880338),
                                    (2.378497, 48.878687),
                                    (2.378561, 48.877615),
                                    (2.379162, 48.876825),
                                    (2.381094, 48.876175),
                                    (2.380879, 48.877573),
                                    (2.382145, 48.8788),
                                    (2.384012, 48.879407),
                                    (2.383454, 48.880127),
                                    (2.381694, 48.880042),
                                    (2.381372, 48.880973),
                                    (2.381136, 48.881707),
                                ],
                            )
                        ]
                    ),
                    srid=SRID,
                ),
                ecological_zonings=[
                    ClearCutEcologicalZoning(
                        ecological_zoning_id=ecological_zoning_id, area_hectare=10
                    )
                ],
            )
        ],
    )
