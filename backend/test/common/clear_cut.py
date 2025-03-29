from datetime import datetime

from geoalchemy2 import WKTElement
from app.models import ClearCut, EcologicalZoning, Registry


def new_clear_cut(
    status: str = "to_validate",
    registries: list[Registry] = [],
    ecological_zonings: list[EcologicalZoning] = [],
):
    return ClearCut(
        cut_date=datetime.now(),
        slope_percentage=15.5,
        location=WKTElement("POINT(48.8566 2.3522)"),
        boundary=WKTElement(
            "POLYGON((2.2241 48.8156, 2.4699 48.8156, 2.4699 48.9021, 2.2241 48.9021, 2.2241 48.8156))"
        ),
        registries=registries,
        ecological_zonings=ecological_zonings,
        status=status,
    )
