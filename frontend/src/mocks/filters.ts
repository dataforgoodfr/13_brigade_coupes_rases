import { HttpResponse, http } from "msw";
import { CLEAR_CUTTING_STATUSES } from "@/features/clear-cut/store/clear-cuts";
import type { FiltersResponse } from "@/features/clear-cut/store/filters";
import { fakeDepartments, fakeRules } from "@/mocks/referential";
export const mockFilters = http.get("*/api/v1/filters", () => {
	return HttpResponse.json({
		cutYears: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
		rulesIds: Object.keys(fakeRules),
		statuses: [...CLEAR_CUTTING_STATUSES],
		departmentsIds: Object.keys(fakeDepartments),
		areaRange: { min: 0.5, max: 10 },
	} satisfies FiltersResponse);
});
