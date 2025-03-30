from datetime import datetime

from geoalchemy2 import WKTElement
from app.models import ClearCut, EcologicalZoning, Registry


def new_clear_cut(
    status: str = "to_validate",
    registries: list[Registry] = None,
    ecological_zonings: list[EcologicalZoning] = None,
):
    return ClearCut(
        cut_date=datetime.now(),
        slope_percentage=15.5,
        location=WKTElement("POINT(48.8566 2.3522)"),
        boundary=WKTElement(
            "POLYGON((2.2241 48.8156, 2.4699 48.8156, 2.4699 48.9021, 2.2241 48.9021, 2.2241 48.8156))"
        ),
        registries=[] if registries is None else registries,
        ecological_zonings=[] if ecological_zonings is None else ecological_zonings,
        status=status,
    )
