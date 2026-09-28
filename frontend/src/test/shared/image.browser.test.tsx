import { describe, expect, it } from "vitest"

import {
	compressPhoto,
	findExifSegment,
	MAX_PHOTO_DIMENSION
} from "@/shared/image"

/** APP1 segment: orientation 6 (rotate 90°) and camera make "Canopee". */
function exifSegment(): Uint8Array {
	const tiff = [
		...[0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08], // big endian, IFD0 at 8
		...[0x00, 0x02], // 2 entries
		...[0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x06, 0x00, 0x00],
		...[0x01, 0x0f, 0x00, 0x02, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x26],
		...[0x00, 0x00, 0x00, 0x00], // no next IFD
		...new TextEncoder().encode("Canopee\0")
	]
	const payload = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff]
	const length = payload.length + 2
	return new Uint8Array([0xff, 0xe1, length >> 8, length & 0xff, ...payload])
}

/** A noisy photo, like a camera shot of foliage: it compresses poorly. */
async function cameraPhoto(width: number, height: number, exif?: Uint8Array) {
	const canvas = new OffscreenCanvas(width, height)
	const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D
	const pixels = context.createImageData(width, height)
	for (let i = 0; i < pixels.data.length; i += 4) {
		const shade = Math.random() * 255
		pixels.data.set([shade * 0.4, shade, shade * 0.3, 255], i)
	}
	context.putImageData(pixels, 0, 0)
	let jpeg = new Uint8Array(
		await (
			await canvas.convertToBlob({ type: "image/jpeg", quality: 0.95 })
		).arrayBuffer()
	)
	if (exif) {
		jpeg = new Uint8Array([
			...jpeg.subarray(0, 2),
			...exif,
			...jpeg.subarray(2)
		])
	}
	return new File([jpeg], "IMG_0001.JPEG", { type: "image/jpeg" })
}

const orientationOf = (segment: Uint8Array) =>
	new DataView(segment.buffer, segment.byteOffset).getUint16(4 + 6 + 10 + 8)

describe("compressPhoto", () => {
	it("resizes a large photo, applies its orientation and keeps its metadata", async () => {
		const original = await cameraPhoto(3000, 2000, exifSegment())

		const photo = await compressPhoto(original)

		expect(photo.type).toBe("image/jpeg")
		expect(photo.name).toBe("IMG_0001.jpg")
		expect(photo.size).toBeLessThan(original.size / 2)
		const bitmap = await createImageBitmap(photo)
		// Rotated by the orientation tag, then resized to the maximum dimension
		expect([bitmap.width, bitmap.height]).toEqual([
			Math.round((2000 * MAX_PHOTO_DIMENSION) / 3000),
			MAX_PHOTO_DIMENSION
		])
		const exif = findExifSegment(new Uint8Array(await photo.arrayBuffer()))
		expect(exif).toBeDefined()
		expect(orientationOf(exif as Uint8Array)).toBe(1)
		expect(new TextDecoder().decode(exif)).toContain("Canopee")
	})

	it("keeps a photo that is already small", async () => {
		const original = await cameraPhoto(40, 30)
		expect(await compressPhoto(original)).toBe(original)
	})

	it("keeps a file the browser cannot decode", async () => {
		const original = new File([new Uint8Array(1000)], "IMG.HEIC", {
			type: "image/heic"
		})
		expect(await compressPhoto(original)).toBe(original)
	})

	it("keeps an animated GIF", async () => {
		const original = new File([new Uint8Array(1000)], "anim.gif", {
			type: "image/gif"
		})
		expect(await compressPhoto(original)).toBe(original)
	})
})
