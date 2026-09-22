import { screen, waitFor } from "@testing-library/dom"
import { describe, expect, it } from "vitest"

import { renderApp } from "@/test/renderApp"

const BANNER_TEXT = /Hors connexion — données non actualisées/

describe("Offline banner", () => {
	it("should show the banner while offline and hide it once back online", async () => {
		await renderApp({ route: "/login", user: undefined })
		await screen.findByRole("button", { name: /connexion/i })
		expect(screen.queryByText(BANNER_TEXT)).toBeNull()

		window.dispatchEvent(new Event("offline"))
		await screen.findByText(BANNER_TEXT)

		window.dispatchEvent(new Event("online"))
		await waitFor(() => expect(screen.queryByText(BANNER_TEXT)).toBeNull())
	})
})
