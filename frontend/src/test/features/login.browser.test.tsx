import { screen } from "@testing-library/dom"
import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"

import { worker } from "@/mocks/browser"
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

	it("tells a volunteer whose account awaits validation", async () => {
		worker.use(refuseToken("USER_INACTIVE", "Votre compte est en attente."))
		const { user } = await renderApp({ route: "/login", user: undefined })
		await loginForm({ user }).logVolunteer()
		await screen.findByText("Compte en attente")
		expect(screen.getByText("Votre compte est en attente.")).toBeInTheDocument()
	})

	it("points a new volunteer to the activation e-mail on wrong credentials", async () => {
		worker.use(
			refuseToken("INVALID_CREDENTIALS", "Incorrect email or password")
		)
		const { user } = await renderApp({ route: "/login", user: undefined })
		await loginForm({ user }).logVolunteer()
		await screen.findByText("Erreur de connexion")
		expect(screen.getByText(/lien reçu par e-mail/)).toBeInTheDocument()
	})
})

function refuseToken(type: string, content: string) {
	return http.post("*/api/v1/token", () =>
		HttpResponse.json({ detail: { type, content } }, { status: 401 })
	)
}
