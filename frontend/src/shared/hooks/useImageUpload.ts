import { useRef, useState } from "react"

import { getStoredToken } from "@/features/user/store/me.slice"
import { api, isNetworkError } from "@/shared/api/api"
import { compressPhoto } from "@/shared/image"

export interface ImageUploadRequest {
	filename: string
	content_type: string
	file_size?: number
	report_id?: string
}

export interface ImageUploadResponse {
	uploadUrl: string
	fields: Record<string, string>
	fileUrl: string
	expiresIn: number
	key: string
}

export interface UploadedImage {
	fileUrl: string
	key: string
	filename: string
}

export interface UploadError {
	filename: string
	message: string
}

export interface UploadResult {
	uploaded: UploadedImage[]
	errors: UploadError[]
	/** Photos (already resized) that could not reach the server: no network. */
	pending: File[]
	/** The user stopped the batch. */
	cancelled: boolean
}

export interface UseImageUploadResult {
	uploadImages: (files: File[], reportId?: string) => Promise<UploadResult>
	uploading: boolean
	error: string | null
	/** Overall progress of the current batch, 0-100. */
	progress: number
	/** Number of the photo currently being sent (1-based) in the current batch. */
	current: number
	/** Total number of photos in the current batch. */
	total: number
	/** Stops the current batch: the photo being sent and the next ones are dropped. */
	cancel: () => void
}

const EXTENSION_TO_MIME: Record<string, string> = {
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	gif: "image/gif",
	webp: "image/webp",
	heic: "image/jpeg",
	heif: "image/jpeg"
}

// Doit rester aligné avec MAX_UPLOAD_SIZE_BYTES côté backend (app/config.py).
const MAX_FILE_SIZE = 25 * 1024 * 1024
const MAX_FILE_SIZE_LABEL = "25 Mo"
/** Per-file upload attempts (1 initial + retries) to survive flaky networks. */
const MAX_ATTEMPTS = 3
/**
 * Give up an attempt when nothing has been sent for this long: a slow but
 * steady upload is not interrupted, a dead network is.
 */
const IDLE_TIMEOUT_MS = 30_000

function inferMimeType(file: File): string {
	if (file.type?.startsWith("image/")) return file.type
	const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
	return EXTENSION_TO_MIME[ext] ?? "image/jpeg"
}

/** The photo did not reach the server: worth keeping it and sending it later. */
export function isConnectivityError(error: unknown) {
	return (
		!navigator.onLine ||
		isNetworkError(error) ||
		(error instanceof Error &&
			(error.name === "TimeoutError" || error.name === "AbortError"))
	)
}

/**
 * Sends the form with XMLHttpRequest, which, unlike fetch, reports the upload
 * progress. Rejects like fetch on a network failure (TypeError), with a
 * TimeoutError when idle for too long and an AbortError when cancelled.
 */
function postWithProgress(
	url: string,
	body: FormData,
	signal: AbortSignal,
	onProgress: (fraction: number) => void
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest()
		let idle: ReturnType<typeof setTimeout>
		const fail = (error: Error) => {
			clearTimeout(idle)
			signal.removeEventListener("abort", onAbort)
			reject(error)
		}
		const armIdleTimer = () => {
			clearTimeout(idle)
			idle = setTimeout(() => {
				xhr.abort()
				const error = new Error("Délai d'envoi dépassé.")
				error.name = "TimeoutError"
				fail(error)
			}, IDLE_TIMEOUT_MS)
		}
		const onAbort = () => {
			xhr.abort()
			fail(new DOMException("Envoi annulé.", "AbortError"))
		}
		xhr.upload.onprogress = (event) => {
			armIdleTimer()
			if (event.lengthComputable) onProgress(event.loaded / event.total)
		}
		xhr.onload = () => {
			clearTimeout(idle)
			signal.removeEventListener("abort", onAbort)
			if (xhr.status >= 200 && xhr.status < 300) {
				onProgress(1)
				resolve()
			} else {
				reject(new Error(`Échec de l'envoi (${xhr.status} ${xhr.statusText}).`))
			}
		}
		xhr.onerror = () => fail(new TypeError("Failed to fetch"))
		if (signal.aborted) return onAbort()
		signal.addEventListener("abort", onAbort)
		xhr.open("POST", url)
		armIdleTimer()
		xhr.send(body)
	})
}

const delay = (ms: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms)
	})

/**
 * Uploads a single file with retries + a per-attempt timeout. Throws only when
 * every attempt has failed, so the caller can record a per-file error without
 * losing the photos that did succeed.
 */
async function uploadSingleFile(
	file: File,
	contentType: string,
	reportId: string | undefined,
	accessToken: string,
	signal: AbortSignal,
	onProgress: (fraction: number) => void
): Promise<UploadedImage> {
	// Keep `api`'s default retry config so a 401 still triggers ky's token
	// refresh (long form sessions can outlive the access token). Our own loop
	// below adds retries for the raw S3 `fetch`, which ky does not manage.
	const authenticatedApi = api.extend({
		headers: { Authorization: `Bearer ${accessToken}` },
		timeout: IDLE_TIMEOUT_MS,
		signal
	})

	const uploadRequest: ImageUploadRequest = {
		filename: file.name,
		content_type: contentType,
		file_size: file.size,
		report_id: reportId
	}

	let lastError: unknown
	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		try {
			const response = await authenticatedApi
				.post("api/v1/images/upload-url", { json: uploadRequest })
				.json<ImageUploadResponse>()

			const formData = new FormData()
			for (const [key, value] of Object.entries(response.fields)) {
				formData.append(key, value)
			}
			formData.append("file", file)

			await postWithProgress(response.uploadUrl, formData, signal, onProgress)

			return {
				fileUrl: response.fileUrl,
				key: response.key,
				filename: file.name
			}
		} catch (err) {
			lastError = err
			// Cancelled, or offline: retrying only delays keeping the photo for later
			if (signal.aborted || !navigator.onLine) break
			if (attempt < MAX_ATTEMPTS) {
				await delay(1000 * attempt)
			}
		}
	}
	throw lastError instanceof Error
		? lastError
		: new Error("Échec de l'envoi de la photo.")
}

export function useImageUpload(): UseImageUploadResult {
	const [uploading, setUploading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [progress, setProgress] = useState(0)
	const [current, setCurrent] = useState(0)
	const [total, setTotal] = useState(0)
	const controllerRef = useRef<AbortController | null>(null)
	const cancel = () => controllerRef.current?.abort()

	const uploadImages = async (
		files: File[],
		reportId?: string
	): Promise<UploadResult> => {
		setUploading(true)
		setError(null)
		setProgress(0)
		setCurrent(0)
		setTotal(files.length)

		const uploaded: UploadedImage[] = []
		const errors: UploadError[] = []
		const pending: File[] = []
		const controller = new AbortController()
		controllerRef.current = controller

		try {
			const token = getStoredToken()
			const totalFiles = files.length

			for (let i = 0; i < totalFiles; i++) {
				if (controller.signal.aborted) break
				const file = files[i]
				setCurrent(i + 1)

				let photo: File | undefined
				let sending = false
				try {
					if (!token) {
						throw new Error("Vous devez être connecté pour envoyer des photos.")
					}

					if (!inferMimeType(file).startsWith("image/")) {
						throw new Error("Ce fichier n'est pas une image.")
					}
					// A phone photo weighs 3 to 8 MB: resize it before sending
					photo = await compressPhoto(file)
					const contentType = inferMimeType(photo)
					if (photo.size > MAX_FILE_SIZE) {
						throw new Error(
							`Photo trop volumineuse (${(photo.size / 1024 / 1024).toFixed(1)} Mo, max ${MAX_FILE_SIZE_LABEL}).`
						)
					}

					sending = true
					const image = await uploadSingleFile(
						photo,
						contentType,
						reportId,
						token.accessToken,
						controller.signal,
						(fraction) => setProgress(((i + fraction) / totalFiles) * 100)
					)
					uploaded.push(image)
				} catch (err) {
					// Cancelled by the user: neither an error nor a photo to keep
					if (controller.signal.aborted) continue
					if (photo && sending && isConnectivityError(err)) {
						pending.push(photo)
						continue
					}
					errors.push({
						filename: file.name,
						message:
							err instanceof Error
								? err.message
								: "Erreur lors de l'envoi de la photo."
					})
				} finally {
					setProgress(((i + 1) / totalFiles) * 100)
				}
			}

			if (errors.length > 0) {
				const plural = errors.length > 1 ? "s" : ""
				setError(
					`${errors.length} photo${plural} n'${errors.length > 1 ? "ont" : "a"} pas pu être envoyée${plural}. Réessayez de les ajouter.`
				)
			}

			return {
				uploaded,
				errors,
				pending,
				cancelled: controller.signal.aborted
			}
		} finally {
			if (controllerRef.current === controller) controllerRef.current = null
			setUploading(false)
		}
	}

	return { uploadImages, uploading, error, progress, current, total, cancel }
}
