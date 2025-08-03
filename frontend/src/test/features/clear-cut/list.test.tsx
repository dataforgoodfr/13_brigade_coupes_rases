import {
	createClearCutReportBaseMock as createClearCutReportMock,
	mockClearCutsResponse,
} from "@/mocks/clear-cuts";
import { server } from "@/test/mocks/server";
import { advancedFilters } from "@/test/page-object/advanced-filters";
import { clearCuts } from "@/test/page-object/clear-cuts";
import { renderApp } from "@/test/renderApp";
import { filtersState } from "@/test/store/filters";
import { describe, expect, it } from "vitest";
describe("Clear cuts list", () => {
	it("should render preview", async () => {
		const report = createClearCutReportMock({
			city: "TEST CITY",
			comment: "TEST COMMENT",
			averageLocation: { type: "Point", coordinates: [15, 15] },
		});
		server.use(
			mockClearCutsResponse({
				previews: [report],
			}),
		);
		const { user } = renderApp({
			preloadedState: {
				filters: filtersState,
			},
			route: "/clear-cuts",
		});

		const filters = advancedFilters({ user });
		await filters.open();
		await filters.favorite.toggle(true);

		const item = await clearCuts({ user }).list.item(report.city);
		expect(item.comment).toBe(report.comment);
	});
});
