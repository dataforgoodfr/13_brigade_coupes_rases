import { CLEAR_CUTTING_STATUSES } from "@/features/clear-cut/store/clear-cuts";
import type { FiltersResponse } from "@/features/clear-cut/store/filters";
import { fakeDepartments, fakeRules } from "@/mocks/referential";
import { http, HttpResponse } from "msw";
export const mockFilters = http.get("*/api/v1/filters", () => {
	return HttpResponse.json({
		cut_years: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
		rules_ids: Object.keys(fakeRules),
		statuses: [...CLEAR_CUTTING_STATUSES],
		departments_ids: Object.keys(fakeDepartments),
		area_range: { min: 0.5, max: 10 },
	} satisfies FiltersResponse);
});
