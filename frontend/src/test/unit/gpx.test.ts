import { describe, expect, it } from "vitest"

import { isSelfIntersecting, readGpx } from "@/shared/gpx"

type LatLon = [number, number]

const points = (tag: string, latLons: LatLon[]) =>
	latLons.map(([lat, lon]) => `<${tag} lat="${lat}" lon="${lon}"/>`).join("")

const gpx = (body: string) =>
	`<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">${body}</gpx>`

const track = (name: string | null, latLons: LatLon[]) =>
	`<trk>${name ? `<name>${name}</name>` : ""}<trkseg>${points("trkpt", latLons)}</trkseg></trk>`

// About 200 m × 200 m in the Landes: 4 ha
const SQUARE: LatLon[] = [
	[44, -0.8],
	[44, -0.7975],
	[44.0018, -0.7975],
	[44.0018, -0.8],
	[44.00001, -0.80001]
]

describe("readGpx", () => {
	it("turns a closed track into a perimeter", () => {
		const result = readGpx(gpx(track("Tour de la coupe", SQUARE)))
		if (!result.ok) throw new Error(result.error)
		expect(result.traces).toHaveLength(1)
		const [trace] = result.traces
		expect(trace.name).toBe("Tour de la coupe")
		expect(trace.problem).toBeUndefined()
		expect(trace.areaHectare).toBeGreaterThan(3.8)
		expect(trace.areaHectare).toBeLessThan(4.2)
		const ring = trace.polygon?.coordinates[0][0] ?? []
		expect(ring[0]).toEqual(ring.at(-1))
		// GeoJSON order: longitude first
		expect(ring[0]).toEqual([-0.8, 44])
	})

	it("reads routes and names unnamed traces", () => {
		const result = readGpx(
			gpx(`${track(null, SQUARE)}<rte>${points("rtept", SQUARE)}</rte>`)
		)
		if (!result.ok) throw new Error(result.error)
		expect(result.traces.map((trace) => trace.name)).toEqual([
			"Trace 1",
			"Itinéraire 2"
		])
		expect(result.traces.every((trace) => trace.polygon)).toBe(true)
	})

	it("joins the segments of a track", () => {
		const result = readGpx(
			gpx(
				`<trk><trkseg>${points("trkpt", SQUARE.slice(0, 2))}</trkseg><trkseg>${points("trkpt", SQUARE.slice(2))}</trkseg></trk>`
			)
		)
		if (!result.ok) throw new Error(result.error)
		expect(result.traces[0].polygon).toBeDefined()
	})

	it("refuses an open track and says why", () => {
		const result = readGpx(
			gpx(
				track("Route forestière", [
					[44, -0.8],
					[44, -0.79],
					[44.01, -0.79]
				])
			)
		)
		if (!result.ok) throw new Error(result.error)
		const [trace] = result.traces
		expect(trace.polygon).toBeUndefined()
		expect(trace.problem).toMatch(/trace ouverte : \d+ m/)
	})

	it("refuses a track that crosses itself", () => {
		const bowtie: LatLon[] = [
			[44, -0.8],
			[44.0018, -0.7975],
			[44, -0.7975],
			[44.0018, -0.8],
			[44, -0.8]
		]
		const result = readGpx(gpx(track("Huit", bowtie)))
		if (!result.ok) throw new Error(result.error)
		expect(result.traces[0].problem).toBe("la trace se croise")
		expect(result.traces[0].polygon).toBeUndefined()
	})

	it("refuses a track with too few points", () => {
		const result = readGpx(gpx(track("Deux points", SQUARE.slice(0, 2))))
		if (!result.ok) throw new Error(result.error)
		expect(result.traces[0].problem).toBe("moins de trois points")
	})

	it("keeps every trace of a file, usable or not", () => {
		const result = readGpx(
			gpx(
				track("Matin", SQUARE) +
					track("Aller", [
						[44, -0.8],
						[44.02, -0.8],
						[44.02, -0.78]
					]) +
					track("Après-midi", SQUARE)
			)
		)
		if (!result.ok) throw new Error(result.error)
		expect(result.traces.map((trace) => Boolean(trace.polygon))).toEqual([
			true,
			false,
			true
		])
	})

	it("reports a file without traces", () => {
		expect(readGpx(gpx(points("wpt", SQUARE)))).toEqual({
			ok: false,
			error: "Ce fichier GPX ne contient aucune trace."
		})
	})

	it("reports a file that is not GPX", () => {
		expect(readGpx("").ok).toBe(false)
		expect(readGpx("<gpx><trk>").ok).toBe(false)
		expect(readGpx("<kml></kml>").ok).toBe(false)
		expect(readGpx("PK\u0003\u0004 binary").ok).toBe(false)
	})
})

describe("isSelfIntersecting", () => {
	it("accepts a square and refuses a bow tie", () => {
		const square: [number, number][] = [
			[0, 0],
			[1, 0],
			[1, 1],
			[0, 1],
			[0, 0]
		]
		const bowtie: [number, number][] = [
			[0, 0],
			[1, 1],
			[1, 0],
			[0, 1],
			[0, 0]
		]
		expect(isSelfIntersecting(square)).toBe(false)
		expect(isSelfIntersecting(bowtie)).toBe(true)
	})
})
