import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"

import { worker } from "@/mocks/browser"
import {
	createClearCutReportResponseBaseMock as createClearCutReportMock,
	mockClearCutsResponse
} from "@/mocks/clear-cuts"
import { advancedFilters } from "@/test/page-object/advanced-filters"
import { clearCuts } from "@/test/page-object/clear-cuts"
import { renderApp } from "@/test/renderApp"
import { filtersState } from "@/test/store/filters"

describe("Clear cuts list", () => {
	it("should render preview", async () => {
		const report = createClearCutReportMock({
			city: "TEST CITY",
			comment: "TEST COMMENT",
			averageLocation: { type: "Point", coordinates: [15, 15] }
		})
		worker.use(
			mockClearCutsResponse({
				previews: [report]
			})
		)
		const { user } = await renderApp({
			preloadedState: {
				filters: filtersState
			},
			route: "/clear-cuts"
		})

		const filters = advancedFilters({ user })
		await filters.open()
		await filters.favorite.toggle(true)

		const item = await clearCuts({ user }).list.item(report.city)
		expect(item.comment).toBe(report.comment)
	})
})

describe("Clear cuts list on a weak network", () => {
	it("keeps the previews shown when the next request fails", async () => {
		const report = createClearCutReportMock({
			city: "TEST CITY",
			comment: "TEST COMMENT",
			averageLocation: { type: "Point", coordinates: [15, 15] }
		})
		worker.use(mockClearCutsResponse({ previews: [report] }))
		const { user, store } = await renderApp({
			preloadedState: {
				filters: filtersState
			},
			route: "/clear-cuts"
		})
		const list = clearCuts({ user }).list
		expect((await list.item(report.city)).comment).toBe(report.comment)

		let failedRequests = 0
		worker.use(
			http.get("*/api/v1/clear-cuts-map", () => {
				failedRequests++
				return HttpResponse.error()
			})
		)
		const filters = advancedFilters({ user })
		await filters.open()
		await filters.favorite.toggle(true)

		await expect.poll(() => failedRequests).toBeGreaterThan(0)
		// Until ky has given up retrying
		await expect
			.poll(() => store.getState().clearCuts.clearCuts.status, {
				timeout: 5000
			})
			.not.toBe("loading")
		expect((await list.item(report.city)).comment).toBe(report.comment)
	})
})
