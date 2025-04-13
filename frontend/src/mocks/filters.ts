import { CLEAR_CUTTING_STATUSES } from "@/features/clear-cut/store/clear-cuts";
import type { FiltersResponse } from "@/features/clear-cut/store/filters";
import { fakeDepartments, fakeTags } from "@/mocks/referential";
import { http, HttpResponse } from "msw";
export const mockFilters = http.get("*/api/v1/filters", () => {
	return HttpResponse.json({
		cut_years: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
		tags_ids: Object.keys(fakeTags),
		statuses: [...CLEAR_CUTTING_STATUSES],
		departments_ids: Object.keys(fakeDepartments),
		area_preset_hectare: [0.5, 1, 2, 5, 10],
	} satisfies FiltersResponse);
});
