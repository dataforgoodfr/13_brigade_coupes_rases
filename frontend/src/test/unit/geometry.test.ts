import { describe, expect, it } from "vitest"

import {
	ringAreaHectare,
	simplifyMultiPolygon,
	simplifyRing
} from "@/shared/geometry"

type Position = [number, number]

// About 10 m in longitude and latitude around 45° N.
const DX = 10 / (111_320 * Math.cos((45 * Math.PI) / 180))
const DY = 10 / 111_320
const at = (x: number, y: number): Position => [2 + x * DX, 45 + y * DY]

describe("simplifyRing", () => {
	it("drops repeated points and points on a straight edge", () => {
		const ring = [
			at(0, 0),
			at(0, 0),
			at(1, 0),
			at(2, 0),
			at(2, 0),
			at(2, 1),
			at(2, 2),
			at(1, 2),
			at(0, 2),
			at(0, 1),
			at(0, 0)
		]
		expect(simplifyRing(ring, 1)).toEqual([
			at(0, 0),
			at(2, 0),
			at(2, 2),
			at(0, 2),
			at(0, 0)
		])
	})

	it("keeps the corners of a pixel staircase below the pixel size", () => {
		const ring = [
			at(0, 0),
			at(3, 0),
			at(3, 1),
			at(2, 1),
			at(2, 2),
			at(1, 2),
			at(1, 3),
			at(0, 3),
			at(0, 0)
		]
		expect(simplifyRing(ring, 1)).toEqual(ring)
	})

	it("returns a ring unchanged when it cannot be simplified into a polygon", () => {
		const ring = [at(0, 0), at(1, 0), at(2, 0), at(0, 0)]
		expect(simplifyRing(ring, 1)).toEqual(ring)
	})
})

describe("simplifyMultiPolygon", () => {
	it("simplifies outer rings and holes", () => {
		const geometry = {
			type: "MultiPolygon" as const,
			coordinates: [
				[
					[at(0, 0), at(2, 0), at(4, 0), at(4, 4), at(0, 4), at(0, 0)],
					[at(1, 1), at(1, 2), at(1, 3), at(3, 3), at(3, 1), at(1, 1)]
				]
			]
		}
		expect(simplifyMultiPolygon(geometry, 1)).toEqual({
			type: "MultiPolygon",
			coordinates: [
				[
					[at(0, 0), at(4, 0), at(4, 4), at(0, 4), at(0, 0)],
					[at(1, 1), at(1, 3), at(3, 3), at(3, 1), at(1, 1)]
				]
			]
		})
	})
})

describe("ringAreaHectare", () => {
	// About 200 m × 200 m in the Landes
	const square: [number, number][] = [
		[-0.8, 44],
		[-0.7975, 44],
		[-0.7975, 44.0018],
		[-0.8, 44.0018]
	]
	it("measures an open ring as if it were closed", () => {
		expect(ringAreaHectare(square)).toBeCloseTo(4, 0)
		expect(ringAreaHectare([...square, square[0]])).toBeCloseTo(
			ringAreaHectare(square)
		)
	})
	it("does not depend on the direction", () => {
		expect(ringAreaHectare([...square].reverse())).toBeCloseTo(
			ringAreaHectare(square)
		)
	})
	it("is zero below three points", () => {
		expect(ringAreaHectare(square.slice(0, 2))).toBe(0)
	})
})
