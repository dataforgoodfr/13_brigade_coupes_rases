import { useState } from "react";
import { getStoredToken } from "@/features/user/store/me.slice";
import { api } from "@/shared/api/api";

export interface ImageViewResponse {
	view_url: string;
	expires_in: number;
}

export interface UseImageViewerResult {
	getViewableUrls: (s3Keys: string[]) => Promise<string[]>;
	loading: boolean;
	error: string | null;
}

export function useImageViewer(): UseImageViewerResult {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const getViewableUrls = async (s3Keys: string[]): Promise<string[]> => {
		if (!s3Keys || s3Keys.length === 0) return [];

		setLoading(true);
		setError(null);

		try {
			const token = getStoredToken();
			if (!token) {
				throw new Error("Authentication required for image viewing");
			}

			const authenticatedApi = api.extend({
				headers: {
					Authorization: `Bearer ${token.accessToken}`,
				},
			});

			const viewableUrls = await Promise.all(
				s3Keys.map(async (s3Key) => {
					try {
						const response = await authenticatedApi
							.get(`api/v1/images/view/${encodeURIComponent(s3Key)}`)
							.json<ImageViewResponse>();
						return response.view_url;
					} catch (_e) {
						return "";
					}
				}),
			);

			return viewableUrls.filter((url) => url !== "");
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to get viewable URLs";
			setError(errorMessage);
			return [];
		} finally {
			setLoading(false);
		}
	};

	return {
		getViewableUrls,
		loading,
		error,
	};
}
