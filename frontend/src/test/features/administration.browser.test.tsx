import { screen, within } from "@testing-library/dom"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"

import { worker } from "@/mocks/browser"
import { adminMock } from "@/test/mocks/user"
import { loginForm } from "@/test/page-object/login"
import { renderApp } from "@/test/renderApp"

describe("Administration", () => {
	it("should see administration button if administrator", async () => {
		const { user } = await renderApp({ route: "/login", user: undefined })
		await loginForm({ user }).logAdministrator()
		await user.click(await screen.findByTitle("Paramètres"))
	})
})

describe("users tab feedback", () => {
	const savedUser = {
		id: "42",
		firstName: "Camille",
		lastName: "Hêtre",
		login: "camille",
		email: "camille@benevoles.org",
		role: "volunteer",
		isActive: true,
		departments: [],
		createdAt: "2026-09-27T10:00:00",
		updatedAt: "2026-09-27T10:00:00",
		deletedAt: null
	}
	beforeEach(() => {
		worker.use(
			http.post(
				"*/api/v1/users/",
				() =>
					new HttpResponse(null, {
						status: 201,
						headers: { location: "/api/v1/users/42" }
					})
			),
			http.put(
				"*/api/v1/users/:id",
				() => new HttpResponse(null, { status: 204 })
			),
			http.get("*/api/v1/users/:id", () => HttpResponse.json(savedUser))
		)
	})
	const openUsersTab = async () => {
		const rendered = await renderApp({
			route: "/administration",
			user: adminMock
		})
		// Keyboard navigation: a toast left by a previous test may cover the tabs
		const tab = await screen.findByRole("tab", { name: "Utilisateurs" })
		tab.focus()
		await rendered.user.keyboard("{Enter}")
		await screen.findByRole("button", { name: "Ajouter" })
		return rendered
	}

	it("announces a created user and the activation email", async () => {
		const { user } = await openUsersTab()
		await user.click(screen.getByRole("button", { name: "Ajouter" }))
		const dialog = await screen.findByRole("dialog")
		const [firstName, lastName, email, login] =
			within(dialog).getAllByRole("textbox")
		await user.type(firstName, "Camille")
		await user.type(lastName, "Hêtre")
		await user.type(email, "camille@benevoles.org")
		await user.type(login, "camille")
		await user.click(
			within(dialog).getByRole("button", { name: "Enregistrer" })
		)

		expect(
			await screen.findByText("Utilisateur camille créé")
		).toBeInTheDocument()
		expect(
			screen.getByText(
				"Un e-mail lui a été envoyé pour choisir son mot de passe."
			)
		).toBeInTheDocument()
		expect(screen.queryByText(/mis à jour/)).not.toBeInTheDocument()
	})
})
