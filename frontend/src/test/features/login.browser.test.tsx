import { screen } from "@testing-library/react"
import { describe, it } from "vitest"

import { loginForm } from "@/test/page-object/login"
import { renderApp } from "@/test/renderApp"

describe("Login", () => {
	it("should log user", async () => {
		const { user } = renderApp({ route: "/login", user: undefined })
		await loginForm({ user }).logVolunteer()
		await screen.findByText("COUPES RASES")
	})
})
