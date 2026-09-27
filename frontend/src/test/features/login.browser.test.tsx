import { screen } from "@testing-library/dom"
import { describe, expect, it } from "vitest"

import { volunteerMock } from "@/test/mocks/user"
import { loginForm } from "@/test/page-object/login"
import { renderApp } from "@/test/renderApp"

describe("Login", () => {
	it("should log user", async () => {
		const { user } = await renderApp({ route: "/login", user: undefined })
		await loginForm({ user }).logVolunteer()
		await screen.findByText("COUPES RASES")
	})

	it("sends an already connected user to the home page", async () => {
		const { router } = await renderApp({
			route: "/login",
			user: volunteerMock
		})
		await expect
			.poll(() => router.state.location.pathname)
			.not.toMatch(/^\/login/)
		expect(screen.queryByText("Too many redirects")).not.toBeInTheDocument()
	})

	it("honours the redirect parameter of an already connected user", async () => {
		const { router } = await renderApp({
			route: "/login?redirect=/my-cuts" as "/login",
			user: volunteerMock
		})
		await expect.poll(() => router.state.location.pathname).toBe("/my-cuts")
	})
})
