import { screen } from "@testing-library/dom"
import { delay, HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import type { UserEvent } from "vitest/browser"

import { worker } from "@/mocks/browser"
import { renderApp } from "@/test/renderApp"

describe("Register", () => {
	it("sends a burst of submissions only once", async () => {
		let registrations = 0
		let answer: () => void = () => {}
		const answered = new Promise<void>((resolve) => {
			answer = resolve
		})
		worker.use(
			http.post("*/api/v1/auth/register", async () => {
				registrations++
				await answered
				await delay(10)
				return HttpResponse.json({}, { status: 201 })
			})
		)
		const { user } = await renderApp({ route: "/register", user: undefined })
		await fillRegisterForm(user)

		const button = screen.getByRole("button", { name: "S'inscrire" })
		const form = button.closest("form")
		// Several submissions before any render, as seen from some phones
		form?.requestSubmit()
		form?.requestSubmit()
		form?.requestSubmit()

		await expect.poll(() => registrations).toBe(1)
		await expect.poll(() => button.hasAttribute("disabled")).toBe(true)
		answer()
		await screen.findByText("Compte créé")
		expect(registrations).toBe(1)
	})

	it("points an existing account to the login and the password reset", async () => {
		worker.use(
			registerFails(409, {
				detail: { type: "USER_ALREADY_EXISTS", content: "Already exists" }
			})
		)
		const { user } = await renderApp({ route: "/register", user: undefined })
		await fillRegisterForm(user)
		await user.click(screen.getByRole("button", { name: "S'inscrire" }))

		await screen.findByText("Compte déjà existant")
		expect(
			screen.getByRole("link", { name: "Connectez-vous" })
		).toHaveAttribute("href", "/login")
		expect(
			screen.getByRole("link", { name: "choisissez un nouveau mot de passe" })
		).toHaveAttribute("href", "/forgot-password")
	})

	it("keeps the generic message for other errors", async () => {
		worker.use(registerFails(500, {}))
		const { user } = await renderApp({ route: "/register", user: undefined })
		await fillRegisterForm(user)
		await user.click(screen.getByRole("button", { name: "S'inscrire" }))

		await screen.findByText("Erreur d'inscription")
		expect(screen.queryByText("Compte déjà existant")).not.toBeInTheDocument()
	})
})

function registerFails(status: number, body: object) {
	return http.post("*/api/v1/auth/register", () =>
		HttpResponse.json(body, { status })
	)
}

async function fillRegisterForm(user: UserEvent) {
	await user.type(await screen.findByLabelText("Prénom"), "Nina")
	await user.type(await screen.findByLabelText("Nom"), "Nouvelle")
	await user.type(await screen.findByLabelText("Identifiant (Login)"), "nina")
	await user.type(await screen.findByLabelText("Email"), "nina@example.com")
	await user.type(
		await screen.findByLabelText("Mot de passe"),
		"un-mot-de-passe"
	)
}
