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

export interface UseImageUploadResult {
	uploadImages: (files: FileList, reportId?: string) => Promise<UploadedImage[]>
	uploading: boolean
	error: string | null
	progress: number
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

function inferMimeType(file: File): string {
	if (file.type && file.type.startsWith("image/")) return file.type
	const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
	return EXTENSION_TO_MIME[ext] ?? "image/jpeg"
}

// Doit rester aligné avec MAX_UPLOAD_SIZE_BYTES côté backend (app/config.py).
const MAX_FILE_SIZE = 25 * 1024 * 1024
const MAX_FILE_SIZE_LABEL = "25 Mo"

export function useImageUpload(): UseImageUploadResult {
	const [uploading, setUploading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [progress, setProgress] = useState(0)

	const uploadImages = async (
		files: FileList,
		reportId?: string
	): Promise<UploadedImage[]> => {
		setUploading(true)
		setError(null)
		setProgress(0)

		try {
			const token = getStoredToken()
			if (!token) {
				const message = "Vous devez être connecté pour envoyer des photos."
				setError(message)
				throw new Error(message)
			}

			const authenticatedApi = api.extend({
				headers: { Authorization: `Bearer ${token.accessToken}` }
			})

			const uploadedImages: UploadedImage[] = []
			const failures: string[] = []
			const totalFiles = files.length

			for (let i = 0; i < totalFiles; i++) {
				const file = files[i]
				try {
					const contentType = inferMimeType(file)

					if (!contentType.startsWith("image/")) {
						throw new Error(`"${file.name}" n'est pas une image`)
					}

					if (file.size > MAX_FILE_SIZE) {
						throw new Error(
							`"${file.name}" est trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo, max ${MAX_FILE_SIZE_LABEL})`
						)
					}

					const uploadRequest: ImageUploadRequest = {
						filename: file.name,
						content_type: contentType,
						file_size: file.size,
						report_id: reportId
					}

					const response = await authenticatedApi
						.post("api/v1/images/upload-url", { json: uploadRequest })
						.json<ImageUploadResponse>()

					const formData = new FormData()
					for (const [key, value] of Object.entries(response.fields)) {
						formData.append(key, value)
					}
					formData.append("file", file)

					const uploadResponse = await fetch(response.uploadUrl, {
						method: "POST",
						body: formData
					})

					if (!uploadResponse.ok) {
						throw new Error(
							`échec de l'envoi de "${file.name}" (${uploadResponse.status})`
						)
					}

					uploadedImages.push({
						fileUrl: response.fileUrl,
						key: response.key,
						filename: file.name
					})
				} catch (fileErr) {
					// On n'interrompt pas le lot : les autres photos valides doivent
					// quand même être envoyées. On collecte les fichiers en échec.
					failures.push(
						fileErr instanceof Error ? fileErr.message : `"${file.name}"`
					)
				} finally {
					setProgress(((i + 1) / totalFiles) * 100)
				}
			}

			if (failures.length > 0) {
				setError(
					`Certaines photos n'ont pas été ajoutées : ${failures.join(" ; ")}.`
				)
			}

			return uploadedImages
		} finally {
			setUploading(false)
		}
	}

	return { uploadImages, uploading, error, progress }
}
