import { screen } from "@testing-library/dom"
import { HttpResponse, http } from "msw"
import { describe, expect, it, onTestFinished } from "vitest"

import { worker } from "@/mocks/browser"
import { createClearCutReportResponseBaseMock } from "@/mocks/clear-cuts"
import { adminMock, volunteerMock } from "@/test/mocks/user"
import { renderApp } from "@/test/renderApp"

const reportsPage = (city: string) => ({
	content: [
		createClearCutReportResponseBaseMock({
			city,
			status: "waiting_for_validation"
		})
	],
	metadata: { links: {}, page: 0, size: 50, pagesCount: 1, totalCount: 1 }
})

/** A response held until the end of the test */
const heldResponse = () => {
	let release = () => {}
	onTestFinished(() => release())
	return new Promise<void>((resolve) => {
		release = resolve
	})
}

describe("pages loading their list", () => {
	it("show their title before the list arrives", async () => {
		const held = heldResponse()
		worker.use(
			http.get("*/api/v1/clear-cuts-reports/", async () => {
				await held
				return HttpResponse.json(reportsPage("Mende"))
			})
		)
		await renderApp({ route: "/my-cuts", user: volunteerMock })

		expect(
			await screen.findByRole("heading", { name: "Mes Coupes" })
		).toBeInTheDocument()
		expect(screen.queryByText("Aucune coupe attribuée")).not.toBeInTheDocument()
	})

	it("keep the previous list on screen while reloading it", async () => {
		let approved = false
		const held = heldResponse()
		worker.use(
			http.get("*/api/v1/clear-cuts-reports/", async () => {
				if (approved) await held
				return HttpResponse.json(reportsPage("Mende"))
			}),
			http.post("*/api/v1/clear-cuts-reports/:id/approve-validation", () => {
				approved = true
				return HttpResponse.json({ message: "OK" })
			})
		)
		const { user } = await renderApp({
			route: "/administration",
			user: adminMock
		})
		await screen.findByText("Mende")

		await user.click(screen.getByRole("button", { name: "Approuver" }))

		await expect
			.poll(() =>
				screen
					.getByText("Mende")
					.closest("[aria-busy]")
					?.getAttribute("aria-busy")
			)
			.toBe("true")
	})
})
