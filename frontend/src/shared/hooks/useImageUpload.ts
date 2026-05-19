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
			const uploadedImages: UploadedImage[] = []
			const totalFiles = files.length

			for (let i = 0; i < totalFiles; i++) {
				const file = files[i]
				const contentType = inferMimeType(file)

				if (!contentType.startsWith("image/")) {
					throw new Error(`Le fichier "${file.name}" n'est pas une image.`)
				}

				const maxSize = 10 * 1024 * 1024
				if (file.size > maxSize) {
					throw new Error(
						`Le fichier "${file.name}" est trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Taille maximale : 10 Mo.`
					)
				}

				const token = getStoredToken()
				if (!token) {
					throw new Error("Vous devez être connecté pour envoyer des photos.")
				}

				const authenticatedApi = api.extend({
					headers: { Authorization: `Bearer ${token.accessToken}` }
				})

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
						`Échec de l'envoi de "${file.name}" (${uploadResponse.status} ${uploadResponse.statusText}).`
					)
				}

				uploadedImages.push({
					fileUrl: response.fileUrl,
					key: response.key,
					filename: file.name
				})

				setProgress(((i + 1) / totalFiles) * 100)
			}

			return uploadedImages
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Erreur lors de l'envoi de la photo."
			setError(errorMessage)
			throw err
		} finally {
			setUploading(false)
		}
	}

	return { uploadImages, uploading, error, progress }
}
