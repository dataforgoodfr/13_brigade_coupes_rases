import { screen } from "@testing-library/dom"
import { HttpResponse, http } from "msw"
import { describe, expect, it, onTestFinished } from "vitest"
import { page } from "vitest/browser"

import { worker } from "@/mocks/browser"
import { volunteerMock } from "@/test/mocks/user"
import { renderApp } from "@/test/renderApp"

describe("About", () => {
	it("is reached from the navigation bar instead of logos", async () => {
		// The side navigation bar only shows on a computer screen
		await page.viewport(1280, 800)
		onTestFinished(() => page.viewport(414, 896))
		const { user, router } = await renderApp({
			route: "/my-cuts",
			user: volunteerMock
		})
		const aboutLink = await screen.findByTitle("À propos")
		expect(screen.queryByAltText("Data For Good")).not.toBeInTheDocument()

		await user.click(aboutLink)

		await expect.poll(() => router.state.location.pathname).toBe("/about")
		await screen.findByText(`Version ${__APP_VERSION__}`)
		expect(screen.getByAltText("Data For Good")).toBeInTheDocument()
	})

	it("is linked from the phone's « Mes coupes » page", async () => {
		worker.use(
			http.get("*/api/v1/clear-cuts-reports/", () =>
				HttpResponse.json({
					content: [],
					metadata: {
						links: {},
						page: 0,
						size: 50,
						pagesCount: 0,
						totalCount: 0
					}
				})
			)
		)
		const { user, router } = await renderApp({
			route: "/my-cuts",
			user: volunteerMock
		})
		await user.click(await screen.findByText("À propos de l'application"))

		await expect.poll(() => router.state.location.pathname).toBe("/about")
	})

	it("is open to visitors without an account", async () => {
		const { user, router } = await renderApp({
			route: "/login",
			user: undefined
		})
		await user.click(await screen.findByText("À propos de l'application"))

		await expect.poll(() => router.state.location.pathname).toBe("/about")
		const github = await screen.findByRole("link", { name: "GitHub" })
		expect(github.getAttribute("href")).toBe(
			"https://github.com/dataforgoodfr/13_brigade_coupes_rases"
		)
	})
})
