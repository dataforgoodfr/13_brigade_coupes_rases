/** Longest side of a photo once resized, in pixels. */
export const MAX_PHOTO_DIMENSION = 2048
/** JPEG quality of the resized photo, between 0 and 1. */
export const PHOTO_QUALITY = 0.82

const JPEG_SOI = 0xffd8
const APP1 = 0xffe1
const SOS = 0xffda
const EXIF_HEADER = [0x45, 0x78, 0x69, 0x66, 0, 0] // "Exif\0\0"
const ORIENTATION_TAG = 0x0112

/**
 * Returns the APP1 Exif segment of a JPEG (marker included), or undefined.
 * The camera metadata (date, position) are kept with the resized photo.
 */
export function findExifSegment(jpeg: Uint8Array): Uint8Array | undefined {
	const view = new DataView(jpeg.buffer, jpeg.byteOffset, jpeg.byteLength)
	if (jpeg.length < 4 || view.getUint16(0) !== JPEG_SOI) return
	let offset = 2
	while (offset + 4 <= jpeg.length) {
		const marker = view.getUint16(offset)
		if ((marker & 0xff00) !== 0xff00 || marker === SOS) return
		const length = view.getUint16(offset + 2)
		if (
			marker === APP1 &&
			EXIF_HEADER.every((byte, i) => jpeg[offset + 4 + i] === byte)
		) {
			return jpeg.slice(offset, offset + 2 + length)
		}
		offset += 2 + length
	}
}

/**
 * Sets the Exif orientation to "normal" in place: the resized pixels are
 * already rotated, a viewer must not rotate them again.
 */
export function resetExifOrientation(segment: Uint8Array) {
	const view = new DataView(segment.buffer, segment.byteOffset, segment.length)
	const tiff = 4 + EXIF_HEADER.length
	if (segment.length < tiff + 8) return
	const littleEndian = view.getUint16(tiff) === 0x4949
	const ifd = tiff + view.getUint32(tiff + 4, littleEndian)
	if (ifd + 2 > segment.length) return
	const entries = view.getUint16(ifd, littleEndian)
	for (let i = 0; i < entries; i++) {
		const entry = ifd + 2 + i * 12
		if (entry + 12 > segment.length) return
		if (view.getUint16(entry, littleEndian) === ORIENTATION_TAG) {
			view.setUint16(entry + 8, 1, littleEndian)
			return
		}
	}
}

/** Inserts an APP1 segment right after the start-of-image marker. */
function withExif(jpeg: Uint8Array, exif: Uint8Array): Uint8Array<ArrayBuffer> {
	const result = new Uint8Array(jpeg.length + exif.length)
	result.set(jpeg.subarray(0, 2))
	result.set(exif, 2)
	result.set(jpeg.subarray(2), 2 + exif.length)
	return result
}

async function encodeJpeg(bitmap: ImageBitmap, width: number, height: number) {
	if (typeof OffscreenCanvas !== "undefined") {
		const canvas = new OffscreenCanvas(width, height)
		canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height)
		return canvas.convertToBlob({ type: "image/jpeg", quality: PHOTO_QUALITY })
	}
	const canvas = document.createElement("canvas")
	canvas.width = width
	canvas.height = height
	canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height)
	return new Promise<Blob>((resolve, reject) =>
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error("toBlob"))),
			"image/jpeg",
			PHOTO_QUALITY
		)
	)
}

/**
 * Resizes a photo to {@link MAX_PHOTO_DIMENSION} and re-encodes it as JPEG,
 * keeping its Exif metadata. The original file is returned unchanged when the
 * browser cannot decode it, when it is an animated format, when it is a JPEG
 * that needs no resizing, or when the result would not be smaller.
 */
export async function compressPhoto(file: File): Promise<File> {
	if (file.type === "image/gif") return file
	let bitmap: ImageBitmap
	try {
		bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
	} catch {
		return file
	}
	try {
		const scale = Math.min(
			1,
			MAX_PHOTO_DIMENSION / Math.max(bitmap.width, bitmap.height)
		)
		// Re-encoding a JPEG of the right size would only lose quality
		if (scale === 1 && file.type === "image/jpeg") return file
		const width = Math.round(bitmap.width * scale)
		const height = Math.round(bitmap.height * scale)
		let jpeg: Uint8Array<ArrayBuffer> = new Uint8Array(
			await (await encodeJpeg(bitmap, width, height)).arrayBuffer()
		)
		const exif = findExifSegment(new Uint8Array(await file.arrayBuffer()))
		if (exif) {
			resetExifOrientation(exif)
			jpeg = withExif(jpeg, exif)
		}
		if (jpeg.length >= file.size) return file
		const name = `${file.name.replace(/\.[^.]*$/, "")}.jpg`
		return new File([jpeg], name, {
			type: "image/jpeg",
			lastModified: file.lastModified
		})
	} catch {
		return file
	} finally {
		bitmap.close()
	}
}
