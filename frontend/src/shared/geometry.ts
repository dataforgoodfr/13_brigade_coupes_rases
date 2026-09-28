export type Boundaries = [
	[number, number],
	[number, number],
	[number, number],
	[number, number]
]
export function isPointInsidePolygon(
	boundaries: Boundaries,
	point: [number, number]
) {
	const [lng, lat] = point
	let inside = false

	for (let i = 0, j = boundaries.length - 1; i < boundaries.length; j = i++) {
		const [lngi, lati] = boundaries[i]
		const [lngj, latj] = boundaries[j]

		const intersect =
			lati > lat !== latj > lat &&
			lng < ((lngj - lngi) * (lat - lati)) / (latj - lati) + lngi

		if (intersect) inside = !inside
	}

	return inside
}

type Position = [number, number]

const METERS_PER_DEGREE = 111_320

/**
 * Douglas-Peucker on a closed ring, in meters (local equirectangular
 * projection, accurate enough at the scale of a clear cut). Consecutive
 * duplicate points are dropped first. A ring that would end up with fewer than
 * four positions is returned unchanged.
 */
export function simplifyRing(
	ring: Position[],
	toleranceMeters: number
): Position[] {
	const deduplicated = ring.filter(
		(point, i) =>
			i === 0 || point[0] !== ring[i - 1][0] || point[1] !== ring[i - 1][1]
	)
	if (deduplicated.length <= 4)
		return deduplicated.length === 4 ? deduplicated : ring

	const lngScale =
		METERS_PER_DEGREE * Math.cos((deduplicated[0][1] * Math.PI) / 180)
	const xy = deduplicated.map(([lng, lat]) => [
		lng * lngScale,
		lat * METERS_PER_DEGREE
	])
	const squaredDistanceToSegment = (p: number, a: number, b: number) => {
		const [px, py] = xy[p]
		const [ax, ay] = xy[a]
		const [bx, by] = xy[b]
		const dx = bx - ax
		const dy = by - ay
		const lengthSquared = dx * dx + dy * dy
		const t =
			lengthSquared === 0
				? 0
				: Math.max(
						0,
						Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared)
					)
		const ex = px - (ax + t * dx)
		const ey = py - (ay + t * dy)
		return ex * ex + ey * ey
	}

	const toleranceSquared = toleranceMeters * toleranceMeters
	const keep = new Uint8Array(deduplicated.length)
	const last = deduplicated.length - 1
	// The ring is closed (first === last): split it at its farthest point so
	// that neither half starts and ends on the same position.
	let farthest = 1
	let farthestDistance = -1
	for (let i = 1; i < last; i++) {
		const distance = squaredDistanceToSegment(i, 0, 0)
		if (distance > farthestDistance) {
			farthest = i
			farthestDistance = distance
		}
	}
	keep[0] = keep[farthest] = keep[last] = 1
	const stack: [number, number][] = [
		[0, farthest],
		[farthest, last]
	]
	while (stack.length > 0) {
		const [start, end] = stack.pop() as [number, number]
		let index = -1
		let maxDistance = toleranceSquared
		for (let i = start + 1; i < end; i++) {
			const distance = squaredDistanceToSegment(i, start, end)
			if (distance > maxDistance) {
				index = i
				maxDistance = distance
			}
		}
		if (index !== -1) {
			keep[index] = 1
			stack.push([start, index], [index, end])
		}
	}

	const simplified = deduplicated.filter((_, i) => keep[i] === 1)
	return simplified.length >= 4 ? simplified : ring
}

/** Apply {@link simplifyRing} to every ring (outer boundaries and holes). */
export function simplifyMultiPolygon<T extends { coordinates: Position[][][] }>(
	geometry: T,
	toleranceMeters: number
): T {
	return {
		...geometry,
		coordinates: geometry.coordinates.map((polygon) =>
			polygon.map((ring) => simplifyRing(ring, toleranceMeters))
		)
	}
}
