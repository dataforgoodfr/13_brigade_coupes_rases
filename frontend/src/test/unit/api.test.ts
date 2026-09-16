import { describe, expect, it } from "vitest"

import { isNetworkError, requestToParams } from "@/shared/api/api"

describe("isNetworkError", () => {
	it("recognises the browsers' fetch failures", () => {
		expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true)
		expect(
			isNetworkError(
				new TypeError("NetworkError when attempting to fetch resource.")
			)
		).toBe(true)
	})

	it("ignores other errors", () => {
		expect(isNetworkError(new Error("Failed to fetch"))).toBe(false)
		expect(isNetworkError(new TypeError("x is not a function"))).toBe(false)
		expect(isNetworkError(undefined)).toBe(false)
	})
})

describe("requestToParams", () => {
	it("repeats arrays and drops empty values", () => {
		const params = requestToParams({
			page: 0,
			ids: ["1", "2"],
			none: undefined,
			nil: null
		})
		expect(params.getAll("ids")).toEqual(["1", "2"])
		expect(params.get("page")).toBe("0")
		expect(params.has("none")).toBe(false)
		expect(params.has("nil")).toBe(false)
	})
})
