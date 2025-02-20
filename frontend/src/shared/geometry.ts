export type Boundaries = [
  [number, number],
  [number, number],
  [number, number],
  [number, number]
];
export function isPointInsidePolygon(
  boundaries: Boundaries,
  point: [number, number]
) {
  const [lng, lat] = point;
  let inside = false;

  for (let i = 0, j = boundaries.length - 1; i < boundaries.length; j = i++) {
    const [lngi, lati] = boundaries[i];
    const [lngj, latj] = boundaries[j];

    const intersect =
      lati > lat !== latj > lat &&
      lng < ((lngj - lngi) * (lat - lati)) / (latj - lati) + lngi;

    if (intersect) inside = !inside;
  }

  return inside;
}
