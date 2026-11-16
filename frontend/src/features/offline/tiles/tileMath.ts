/** Web Mercator tiles (the "PM" matrix set of the Géoplateforme). */

export type TileCoord = { x: number; y: number; z: number }

export type GeoBounds = {
	south: number
	west: number
	north: number
	east: number
}

const MAX_LATITUDE = 85.0511287798

const clampIndex = (index: number, z: number) =>
	Math.min(Math.max(index, 0), 2 ** z - 1)

export function lngToTileX(lng: number, z: number): number {
	return clampIndex(Math.floor(((lng + 180) / 360) * 2 ** z), z)
}

export function latToTileY(lat: number, z: number): number {
	const clamped = Math.min(Math.max(lat, -MAX_LATITUDE), MAX_LATITUDE)
	const rad = (clamped * Math.PI) / 180
	const y = ((1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2) * 2 ** z
	return clampIndex(Math.floor(y), z)
}

/** Tile index ranges covering the bounds at one zoom level, inclusive. */
export function tileRange(bounds: GeoBounds, z: number) {
	return {
		xMin: lngToTileX(bounds.west, z),
		xMax: lngToTileX(bounds.east, z),
		// Tile rows grow southwards
		yMin: latToTileY(bounds.north, z),
		yMax: latToTileY(bounds.south, z)
	}
}

export function countTiles(
	bounds: GeoBounds,
	minZoom: number,
	maxZoom: number
): number {
	let count = 0
	for (let z = minZoom; z <= maxZoom; z++) {
		const { xMin, xMax, yMin, yMax } = tileRange(bounds, z)
		count += (xMax - xMin + 1) * (yMax - yMin + 1)
	}
	return count
}

export function* tilesInBounds(
	bounds: GeoBounds,
	minZoom: number,
	maxZoom: number
): Generator<TileCoord> {
	for (let z = minZoom; z <= maxZoom; z++) {
		const { xMin, xMax, yMin, yMax } = tileRange(bounds, z)
		for (let x = xMin; x <= xMax; x++) {
			for (let y = yMin; y <= yMax; y++) {
				yield { x, y, z }
			}
		}
	}
}
