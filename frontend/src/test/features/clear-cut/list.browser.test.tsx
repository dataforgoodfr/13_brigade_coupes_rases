import { describe, expect, it } from "vitest";
import { worker } from "@/mocks/browser";
import {
	createClearCutReportResponseBaseMock as createClearCutReportMock,
	mockClearCutsResponse,
} from "@/mocks/clear-cuts";
import { advancedFilters } from "@/test/page-object/advanced-filters";
import { clearCuts } from "@/test/page-object/clear-cuts";
import { renderApp } from "@/test/renderApp";
import { filtersState } from "@/test/store/filters";

describe("Clear cuts list", () => {
	it("should render preview", async () => {
		const report = createClearCutReportMock({
			city: "TEST CITY",
			comment: "TEST COMMENT",
			averageLocation: { type: "Point", coordinates: [15, 15] },
		});
		worker.use(
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
