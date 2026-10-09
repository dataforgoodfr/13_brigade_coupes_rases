import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { api, isNetworkError } from "@/shared/api/api"

// Structurally valid JWTs: tokenSchema only checks the format
const jwt = (sub: string) =>
	`${btoa('{"alg":"HS256","typ":"JWT"}')}.${btoa(`{"sub":"${sub}"}`).replace(/=+$/, "")}.c2ln`
const storedToken = () => JSON.parse(localStorage.getItem("token") ?? "null")

type Reply = Response | Error
const json = (status: number, body: unknown = {}) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" }
	})

/** Answers the refresh call with `refresh`, the other calls in order with `replies`. */
function stubFetch(replies: Reply[], refresh?: Reply) {
	const calls: { url: string; authorization: string | null }[] = []
	vi.stubGlobal(
		"fetch",
		vi.fn(async (request: Request) => {
			calls.push({
				url: request.url,
				authorization: request.headers.get("authorization")
			})
			const reply = request.url.includes("token/refresh")
				? refresh instanceof Response
					? refresh.clone()
					: refresh
				: replies.shift()
			if (reply === undefined) throw new Error(`unexpected ${request.url}`)
			if (reply instanceof Error) throw reply
			return reply
		})
	)
	return calls
}

const client = api.extend({
	prefix: "http://api.test",
	retry: { delay: () => 0 }
})

describe("api session handling", () => {
	beforeEach(() => {
		localStorage.clear()
		localStorage.setItem(
			"token",
			JSON.stringify({
				accessToken: jwt("old"),
				refreshToken: jwt("refresh"),
				tokenType: "bearer"
			})
		)
		localStorage.setItem("me", JSON.stringify({ favorites: [] }))
	})
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.restoreAllMocks()
	})

	it("refreshes an expired access token and replays the request", async () => {
		const fresh = {
			accessToken: jwt("new"),
			refreshToken: jwt("refresh2"),
			tokenType: "bearer"
		}
		const calls = stubFetch(
			[json(401), json(200, { ok: true })],
			json(200, fresh)
		)

		await expect(client.get("api/v1/me").json()).resolves.toEqual({ ok: true })
		expect(storedToken()).toMatchObject({
			accessToken: fresh.accessToken,
			refreshToken: fresh.refreshToken
		})
		expect(calls.at(-1)?.authorization).toBe(`Bearer ${fresh.accessToken}`)
	})

	it("keeps the session when the refresh cannot reach the server", async () => {
		stubFetch([json(401)], new TypeError("Failed to fetch"))

		const error = await client.get("api/v1/me").catch((e: unknown) => e)
		expect(isNetworkError(error)).toBe(true)
		expect(storedToken()?.refreshToken).toBe(jwt("refresh"))
		expect(localStorage.getItem("me")).not.toBeNull()
	})

	it("ends the session when the server refuses the refresh token", async () => {
		stubFetch([json(401), json(401), json(401)], json(401))

		await expect(client.get("api/v1/me")).rejects.toThrow()
		expect(storedToken()).toBeNull()
		expect(localStorage.getItem("me")).toBeNull()
	})

	it("does not retry refused credentials", async () => {
		const calls = stubFetch([json(401)])

		await expect(client.post("api/v1/token/")).rejects.toThrow()
		expect(calls).toHaveLength(1)
	})

	it("does not retry a 401 without a refresh token", async () => {
		localStorage.removeItem("token")
		const calls = stubFetch([json(401)])

		await expect(client.get("api/v1/me")).rejects.toThrow()
		expect(calls).toHaveLength(1)
	})

	it("replays a request only once after refreshing the token", async () => {
		const fresh = {
			accessToken: jwt("new"),
			refreshToken: jwt("refresh2"),
			tokenType: "bearer"
		}
		const calls = stubFetch(
			[json(401), json(401), json(200, { ok: true })],
			json(200, fresh)
		)

		await expect(client.get("api/v1/me")).rejects.toThrow()
		expect(calls.filter((c) => !c.url.includes("token/refresh"))).toHaveLength(
			2
		)
	})

	it("does not refresh the token on a server error", async () => {
		const calls = stubFetch([json(500), json(200, { ok: true })])

		await expect(client.get("api/v1/me").json()).resolves.toEqual({ ok: true })
		expect(calls.some((c) => c.url.includes("token/refresh"))).toBe(false)
	})

	it("does not retry a request while offline", async () => {
		vi.spyOn(navigator, "onLine", "get").mockReturnValue(false)
		const calls = stubFetch([new TypeError("Failed to fetch")])

		const error = await client.get("api/v1/me").catch((e: unknown) => e)
		expect(isNetworkError(error)).toBe(true)
		expect(calls).toHaveLength(1)
		expect(storedToken()?.refreshToken).toBe(jwt("refresh"))
	})
})
