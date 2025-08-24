import ky from "ky";
import z from "zod";
import type { RequestedContent } from "@/shared/api/types";
export const UNAUTHORIZED_ERROR_NAME = "Unauthorized";
export const api = ky.extend({
	prefixUrl: import.meta.env.VITE_API,
	hooks: {
		beforeError: [
			async (error) => {
				const { response } = error;
				if (response.status === 401) {
					error.name = UNAUTHORIZED_ERROR_NAME;
				}
				return error;
			},
		],
	},
});
export const requestToParams = <T extends Record<string, unknown>>(
	request: T,
) => {
	const searchParams = new URLSearchParams();
	for (const key in request) {
		const value = request[key as keyof T];
		if (Array.isArray(value)) {
			for (const v of value) {
				searchParams.append(key, v.toString());
			}
		} else if (value !== undefined && value !== null) {
			searchParams.append(key, value.toString());
		}
	}
	return searchParams;
};

export const parseParam = (
	key: string,
	value: unknown,
	searchParams: URLSearchParams,
) => {
	if (Array.isArray(value)) {
		for (const v of value) {
			searchParams.append(key, v.toString());
		}
	} else if (value !== undefined) {
		searchParams.append(key, JSON.stringify(value));
	}
};

export const toApiErrorSchema = <
	Type extends z.ZodLiteral,
	Content extends z.ZodType = z.ZodString,
>(
	type: Type,
	content: Content,
) => z.object({ detail: z.object({ type, content: content }) });
export const toStringApiErrorSchema = <Type extends z.ZodLiteral>(type: Type) =>
	toApiErrorSchema(type, z.string());

export const setSuccess = <TValue, TError>(
	requestedContent: RequestedContent<TValue, TError>,
	value: TValue,
): RequestedContent<TValue, TError> => {
	requestedContent.status = "success";
	requestedContent.value = value;
	requestedContent.error = undefined;
	return requestedContent;
};
export const setLoading = <TValue, TError>(
	requestedContent: RequestedContent<TValue, TError>,
): RequestedContent<TValue, TError> => {
	requestedContent.status = "loading";
	requestedContent.error = undefined;
	return requestedContent;
};
export const setIdle = <TValue, TError>(
	requestedContent: RequestedContent<TValue, TError>,
): RequestedContent<TValue, TError> => {
	requestedContent.status = "idle";
	requestedContent.error = undefined;
	requestedContent.value = undefined;
	return requestedContent;
};
export const setError = <TValue, TError>(
	requestedContent: RequestedContent<TValue, TError>,
	error: TError,
): RequestedContent<TValue, TError> => {
	requestedContent.status = "error";
	requestedContent.value = undefined;
	requestedContent.error = error;
	return requestedContent;
};
