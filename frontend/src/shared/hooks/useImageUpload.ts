import { useState } from "react"

import { getStoredToken } from "@/features/user/store/me.slice"
import { api } from "@/shared/api/api"

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
}

export interface UseImageUploadResult {
	uploadImages: (files: FileList, reportId?: string) => Promise<UploadResult>
	uploading: boolean
	error: string | null
	/** Overall progress of the current batch, 0-100. */
	progress: number
	/** Number of the photo currently being sent (1-based) in the current batch. */
	current: number
	/** Total number of photos in the current batch. */
	total: number
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

const MAX_FILE_SIZE = 10 * 1024 * 1024
/** Per-file upload attempts (1 initial + retries) to survive flaky networks. */
const MAX_ATTEMPTS = 3
/** Abort a single attempt after this delay to avoid hanging on dead networks. */
const ATTEMPT_TIMEOUT_MS = 30_000

function inferMimeType(file: File): string {
	if (file.type && file.type.startsWith("image/")) return file.type
	const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
	return EXTENSION_TO_MIME[ext] ?? "image/jpeg"
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
	accessToken: string
): Promise<UploadedImage> {
	// Keep `api`'s default retry config so a 401 still triggers ky's token
	// refresh (long form sessions can outlive the access token). Our own loop
	// below adds retries for the raw S3 `fetch`, which ky does not manage.
	const authenticatedApi = api.extend({
		headers: { Authorization: `Bearer ${accessToken}` },
		timeout: ATTEMPT_TIMEOUT_MS
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

			const controller = new AbortController()
			const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS)
			try {
				const uploadResponse = await fetch(response.uploadUrl, {
					method: "POST",
					body: formData,
					signal: controller.signal
				})
				if (!uploadResponse.ok) {
					throw new Error(
						`Échec de l'envoi (${uploadResponse.status} ${uploadResponse.statusText}).`
					)
				}
			} finally {
				clearTimeout(timer)
			}

			return {
				fileUrl: response.fileUrl,
				key: response.key,
				filename: file.name
			}
		} catch (err) {
			lastError = err
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

	const uploadImages = async (
		files: FileList,
		reportId?: string
	): Promise<UploadResult> => {
		setUploading(true)
		setError(null)
		setProgress(0)
		setCurrent(0)
		setTotal(files.length)

		const uploaded: UploadedImage[] = []
		const errors: UploadError[] = []

		try {
			const token = getStoredToken()
			const totalFiles = files.length

			for (let i = 0; i < totalFiles; i++) {
				const file = files[i]
				setCurrent(i + 1)

				try {
					if (!token) {
						throw new Error("Vous devez être connecté pour envoyer des photos.")
					}

					const contentType = inferMimeType(file)
					if (!contentType.startsWith("image/")) {
						throw new Error("Ce fichier n'est pas une image.")
					}
					if (file.size > MAX_FILE_SIZE) {
						throw new Error(
							`Photo trop volumineuse (${(file.size / 1024 / 1024).toFixed(1)} Mo, max 10 Mo).`
						)
					}

					const image = await uploadSingleFile(
						file,
						contentType,
						reportId,
						token.accessToken
					)
					uploaded.push(image)
				} catch (err) {
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

			return { uploaded, errors }
		} finally {
			setUploading(false)
		}
	}

	return { uploadImages, uploading, error, progress, current, total }
}
