import { simplifyRing } from "@/shared/geometry"

type Position = [number, number]

export type GpxPolygon = {
	type: "MultiPolygon"
	coordinates: Position[][][]
}

/** One track or route of a GPX file, ready to become a perimeter or not. */
export type GpxTrace = {
	name: string
	pointCount: number
	lengthMeters: number
	/** Distance between the first and the last point */
	gapMeters: number
	areaHectare: number
	/** Set when the trace can become a perimeter */
	polygon?: GpxPolygon
	/** Why the trace cannot become a perimeter */
	problem?: string
}

export type GpxReadResult =
	| { ok: true; traces: GpxTrace[] }
	| { ok: false; error: string }

/** A GPS walk around a cut rarely ends exactly where it started. */
export const MAX_CLOSING_GAP_METERS = 100
const SIMPLIFY_TOLERANCE_METERS = 1
const METERS_PER_DEGREE = 111_320

function toLocalMeters(points: Position[]): [number, number][] {
	const lngScale = METERS_PER_DEGREE * Math.cos((points[0][1] * Math.PI) / 180)
	return points.map(([lng, lat]) => [lng * lngScale, lat * METERS_PER_DEGREE])
}

function distanceMeters(a: Position, b: Position): number {
	const [[ax, ay], [bx, by]] = toLocalMeters([a, b])
	return Math.hypot(bx - ax, by - ay)
}

function pathLengthMeters(points: Position[]): number {
	const xy = toLocalMeters(points)
	let length = 0
	for (let i = 1; i < xy.length; i++) {
		length += Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1])
	}
	return length
}

/** Shoelace formula on a closed ring, in square meters. */
function ringAreaSquareMeters(ring: Position[]): number {
	const xy = toLocalMeters(ring)
	let twiceArea = 0
	for (let i = 1; i < xy.length; i++) {
		twiceArea += xy[i - 1][0] * xy[i][1] - xy[i][0] * xy[i - 1][1]
	}
	return Math.abs(twiceArea) / 2
}

function segmentsCross(
	[a, b]: [Position, Position],
	[c, d]: [Position, Position]
): boolean {
	const orientation = (p: Position, q: Position, r: Position) =>
		Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]))
	return (
		orientation(a, b, c) * orientation(a, b, d) < 0 &&
		orientation(c, d, a) * orientation(c, d, b) < 0
	)
}

/** Whether two non-adjacent edges of the closed ring cross each other. */
export function isSelfIntersecting(ring: Position[]): boolean {
	const edges = ring.length - 1
	for (let i = 0; i < edges; i++) {
		for (let j = i + 2; j < edges; j++) {
			// The first and the last edges share the closing point
			if (i === 0 && j === edges - 1) continue
			if (segmentsCross([ring[i], ring[i + 1]], [ring[j], ring[j + 1]]))
				return true
		}
	}
	return false
}

function readPoints(elements: Iterable<Element>): Position[] {
	const points: Position[] = []
	for (const element of elements) {
		const lat = Number.parseFloat(element.getAttribute("lat") ?? "")
		const lng = Number.parseFloat(element.getAttribute("lon") ?? "")
		if (Number.isNaN(lat) || Number.isNaN(lng)) continue
		const previous = points.at(-1)
		if (previous && previous[0] === lng && previous[1] === lat) continue
		points.push([lng, lat])
	}
	return points
}

function childName(element: Element): string | undefined {
	for (const child of Array.from(element.children)) {
		if (child.localName === "name")
			return child.textContent?.trim() || undefined
	}
	return undefined
}

function toTrace(name: string, points: Position[]): GpxTrace {
	const base = {
		name,
		pointCount: points.length,
		lengthMeters: 0,
		gapMeters: 0,
		areaHectare: 0
	}
	if (points.length < 3) {
		return { ...base, problem: "moins de trois points" }
	}
	const lengthMeters = pathLengthMeters(points)
	const gapMeters = distanceMeters(points[0], points[points.length - 1])
	const measured = { ...base, lengthMeters, gapMeters }
	if (gapMeters > MAX_CLOSING_GAP_METERS) {
		return {
			...measured,
			problem: `trace ouverte : ${Math.round(gapMeters)} m entre le départ et l'arrivée`
		}
	}
	const ring = simplifyRing([...points, points[0]], SIMPLIFY_TOLERANCE_METERS)
	if (ring.length >= 4 && isSelfIntersecting(ring)) {
		return { ...measured, problem: "la trace se croise" }
	}
	const areaHectare = ringAreaSquareMeters(ring) / 10_000
	if (ring.length < 4 || areaHectare === 0) {
		return { ...measured, problem: "la trace n'entoure aucune surface" }
	}
	return {
		...measured,
		areaHectare,
		polygon: { type: "MultiPolygon", coordinates: [[ring]] }
	}
}

/**
 * Reads the tracks and routes of a GPX file. Each one becomes a perimeter when
 * it is closed (its ends less than {@link MAX_CLOSING_GAP_METERS} apart), does
 * not cross itself and surrounds an area. Waypoints are ignored.
 */
export function readGpx(text: string): GpxReadResult {
	const document = new DOMParser().parseFromString(text, "application/xml")
	const root = document.documentElement
	if (
		root?.localName !== "gpx" ||
		document.getElementsByTagName("parsererror").length > 0
	) {
		return { ok: false, error: "Ce fichier n'est pas un fichier GPX lisible." }
	}
	const traces: GpxTrace[] = []
	for (const track of Array.from(root.getElementsByTagName("trk"))) {
		const points = readPoints(track.getElementsByTagName("trkpt"))
		traces.push(
			toTrace(childName(track) ?? `Trace ${traces.length + 1}`, points)
		)
	}
	for (const route of Array.from(root.getElementsByTagName("rte"))) {
		const points = readPoints(route.getElementsByTagName("rtept"))
		traces.push(
			toTrace(childName(route) ?? `Itinéraire ${traces.length + 1}`, points)
		)
	}
	if (traces.length === 0) {
		return { ok: false, error: "Ce fichier GPX ne contient aucune trace." }
	}
	return { ok: true, traces }
}
