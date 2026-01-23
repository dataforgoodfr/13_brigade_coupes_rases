import { isUndefined } from "es-toolkit"
import ky from "ky"
import z from "zod"

import { type TokenResponse, tokenSchema } from "@/features/user/store/me"
import type { RequestedContent } from "@/shared/api/types"
import { localStorageRepository } from "@/shared/localStorage"
export const UNAUTHORIZED_ERROR_NAME = "Unauthorized"
const tokenStorage = localStorageRepository<TokenResponse>("token")
const meStorage = localStorageRepository<TokenResponse>("me")

export const api = ky.extend({
	prefixUrl: import.meta.env.VITE_API,
	retry: {
		statusCodes: [408, 413, 429, 500, 502, 503, 504, 401],
		methods: ["get", "post", "put", "head", "delete", "options", "trace"]
	},
	hooks: {
		beforeError: [
			async (error) => {
				const { response } = error
				if (response.status === 401) {
					error.name = UNAUTHORIZED_ERROR_NAME
				}
				return error
			}
		],
		beforeRetry: [
			async ({ request }) => {
				const refreshToken =
					tokenStorage.getFromLocalStorage(tokenSchema)?.refreshToken
				if (
					request.url.includes("token/refresh") ||
					isUndefined(refreshToken)
				) {
					return
				}
				try {
					const tokenResponse = await ky
						.post(`api/v1/token/refresh/`, {
							prefixUrl: import.meta.env.VITE_API,
							json: {
								refreshToken
							}
						})
						.json()
					const token = tokenSchema.parse(tokenResponse)
					tokenStorage.setToLocalStorage(token)
					request.headers.set("Authorization", `Bearer ${token.accessToken}`)
				} catch (err) {
					// Logout user if refresh fails
					tokenStorage.setToLocalStorage(undefined)
					meStorage.setToLocalStorage(undefined)
					// Go to login page
					window.location.href = "/login"
				}
			}
		]
	}
})
const objectToString = Object.prototype.toString

function isError(value: unknown): value is Error {
	return objectToString.call(value) === "[object Error]"
}

const errorMessages = new Set([
	"net::ERR_INTERNET_DISCONNECTED",
	"network error", // Chrome
	"Failed to fetch", // Chrome
	"NetworkError when attempting to fetch resource.", // Firefox
	"The Internet connection appears to be offline.", // Safari 16
	"Load failed", // Safari 17+
	"Network request failed", // `cross-fetch`
	"fetch failed", // Undici (Node.js)
	"terminated" // Undici (Node.js)
])

export function isNetworkError(error: unknown) {
	const isValid =
		error &&
		isError(error) &&
		error.name === "TypeError" &&
		typeof error.message === "string"

	if (!isValid) {
		return false
	}

	// We do an extra check for Safari 17+ as it has a very generic error message.
	// Network errors in Safari have no stack.
	if (error.message === "Load failed") {
		return error.stack === undefined
	}

	return errorMessages.has(error.message)
}

export const requestToParams = <T extends Record<string, unknown>>(
	request: T
) => {
	const searchParams = new URLSearchParams()
	for (const key in request) {
		const value = request[key as keyof T]
		if (Array.isArray(value)) {
			for (const v of value) {
				searchParams.append(key, v.toString())
			}
		} else if (value !== undefined && value !== null) {
			searchParams.append(key, value.toString())
		}
	}
	return searchParams
}

export const parseParam = (
	key: string,
	value: unknown,
	searchParams: URLSearchParams
) => {
	if (Array.isArray(value)) {
		for (const v of value) {
			searchParams.append(key, v.toString())
		}
	} else if (value !== undefined) {
		searchParams.append(key, JSON.stringify(value))
	}
}

export const toApiErrorSchema = <
	Type extends z.ZodLiteral,
	Content extends z.ZodType = z.ZodString
>(
	type: Type,
	content: Content
) => z.object({ detail: z.object({ type, content: content }) })
export const toStringApiErrorSchema = <Type extends z.ZodLiteral>(type: Type) =>
	toApiErrorSchema(type, z.string())

export const setSuccess = <TValue, TError>(
	requestedContent: RequestedContent<TValue, TError>,
	value: TValue
): RequestedContent<TValue, TError> => {
	requestedContent.status = "success"
	requestedContent.value = value
	requestedContent.error = undefined
	return requestedContent
}
export const setLoading = <TValue, TError>(
	requestedContent: RequestedContent<TValue, TError>
): RequestedContent<TValue, TError> => {
	requestedContent.status = "loading"
	requestedContent.error = undefined
	return requestedContent
}
export const setIdle = <TValue, TError>(
	requestedContent: RequestedContent<TValue, TError>
): RequestedContent<TValue, TError> => {
	requestedContent.status = "idle"
	requestedContent.error = undefined
	requestedContent.value = undefined
	return requestedContent
}
export const setError = <TValue, TError>(
	requestedContent: RequestedContent<TValue, TError>,
	error: TError
): RequestedContent<TValue, TError> => {
	requestedContent.status = "error"
	requestedContent.value = undefined
	requestedContent.error = error
	return requestedContent
}
