import {
	createClearCutReportBaseMock as createClearCutReportMock,
	mockClearCuttingsResponse,
} from "@/mocks/clear-cuttings";
import { server } from "@/test/mocks/server";
import { advancedFilters } from "@/test/page-object/advanced-filters";
import { clearCuttings } from "@/test/page-object/clear-cuttings";
import { renderApp } from "@/test/renderApp";
import { filtersState } from "@/test/store/filters";
import { describe, expect, it } from "vitest";
describe("Clear cuttings list", () => {
	it("should render preview", async () => {
		const report = createClearCutReportMock({
			city: "TEST CITY",
			comment: "TEST COMMENT",
			average_location: { type: "Point", coordinates: [15, 15] },
		});
		server.use(
			mockClearCuttingsResponse({
				previews: [report],
			}),
		);
		const { user } = renderApp({
			preloadedState: {
				filters: filtersState,
			},
			route: "/clear-cuttings",
		});

		const filters = advancedFilters({ user });
		await filters.open();
		await filters.favorite.toggle();

		const item = await clearCuttings({ user }).list.item(report.city);
		expect(item.comment).toBe(report.comment);
	});
});
