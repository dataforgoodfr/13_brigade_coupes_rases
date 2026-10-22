import { screen } from "@testing-library/dom"
import { delay, HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"

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
		await user.type(await screen.findByLabelText("Prénom"), "Nina")
		await user.type(await screen.findByLabelText("Nom"), "Nouvelle")
		await user.type(await screen.findByLabelText("Identifiant (Login)"), "nina")
		await user.type(await screen.findByLabelText("Email"), "nina@example.com")
		await user.type(
			await screen.findByLabelText("Mot de passe"),
			"un-mot-de-passe"
		)

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
})
