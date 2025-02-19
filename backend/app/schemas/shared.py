from pydantic import BaseModel


class Point(BaseModel) : tuple[float, float]


class GeoBounds(BaseModel): (Point, Point)
