import { getStoredToken } from "@/features/user/store/user.slice";
import { api } from "@/shared/api/api";
import { useState } from "react";

export interface ImageUploadRequest {
	filename: string;
	content_type: string;
	file_size?: number;
	report_id?: string;
}

export interface ImageUploadResponse {
	upload_url: string;
	fields: Record<string, string>;
	file_url: string;
	expires_in: number;
	key: string;
}

export interface UploadedImage {
	file_url: string;
	key: string;
	filename: string;
}

export interface UseImageUploadResult {
	uploadImages: (
		files: FileList,
		reportId?: string,
	) => Promise<UploadedImage[]>;
	uploading: boolean;
	error: string | null;
	progress: number;
}

export function useImageUpload(): UseImageUploadResult {
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [progress, setProgress] = useState(0);

	const uploadImages = async (
		files: FileList,
		reportId?: string,
	): Promise<UploadedImage[]> => {
		setUploading(true);
		setError(null);
		setProgress(0);

		try {
			const uploadedImages: UploadedImage[] = [];
			const totalFiles = files.length;

			for (let i = 0; i < totalFiles; i++) {
				const file = files[i];

				// Validate file type
				if (!file.type.startsWith("image/")) {
					throw new Error(`File ${file.name} is not an image`);
				}

				// Validate file size (10MB limit)
				const maxSize = 10 * 1024 * 1024;
				if (file.size > maxSize) {
					throw new Error(
						`File ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB`,
					);
				}

				// Get pre-signed URL
				const uploadRequest: ImageUploadRequest = {
					filename: file.name,
					content_type: file.type,
					file_size: file.size,
					report_id: reportId,
				};

				// Get authenticated API instance
				const token = getStoredToken();
				if (!token) {
					throw new Error("Authentication required for image upload");
				}

				const authenticatedApi = api.extend({
					headers: {
						Authorization: `Bearer ${token.access_token}`,
					},
				});

				const response = await authenticatedApi
					.post("api/v1/images/upload-url", {
						json: uploadRequest,
					})
					.json<ImageUploadResponse>();

				// Upload file directly to S3 using pre-signed POST
				const formData = new FormData();

				// Add all the fields from the pre-signed POST
				for (const [key, value] of Object.entries(response.fields)) {
					formData.append(key, value);
				}

				// Add the file last
				formData.append("file", file);

				const uploadResponse = await fetch(response.upload_url, {
					method: "POST",
					body: formData,
				});

				if (!uploadResponse.ok) {
					throw new Error(
						`Failed to upload ${file.name}: ${uploadResponse.statusText}`,
					);
				}

				uploadedImages.push({
					file_url: response.file_url,
					key: response.key,
					filename: file.name,
				});

				// Update progress
				setProgress(((i + 1) / totalFiles) * 100);
			}

			return uploadedImages;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Upload failed";
			setError(errorMessage);
			throw err;
		} finally {
			setUploading(false);
		}
	};

	return {
		uploadImages,
		uploading,
		error,
		progress,
	};
}
