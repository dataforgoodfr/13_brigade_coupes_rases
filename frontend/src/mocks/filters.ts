import type { FiltersResponse } from "@/features/clear-cutting/store/filters";
import { fakeDepartments, fakeStatuses, fakeTags } from "@/mocks/referential";
import { http, HttpResponse } from "msw";
export const mockFilters = http.get("*/filters", () => {
	return HttpResponse.json({
		cutYears: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
		tags: Object.keys(fakeTags),
		statuses: Object.keys(fakeStatuses),
		departments: Object.keys(fakeDepartments),
		areaPresetsHectare: [0.5, 1, 2, 5, 10],
	} satisfies FiltersResponse);
});
