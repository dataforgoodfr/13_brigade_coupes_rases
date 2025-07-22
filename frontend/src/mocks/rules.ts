import type { RulesResponse } from "@/features/admin/store/rules";
import { fakeRules } from "@/mocks/referential";
import { http, HttpResponse } from "msw";

export const mockRules = http.get("*/api/v1/rules", () => {
	return HttpResponse.json(
		Object.entries(fakeRules).map(([id, rule]) => ({
			id,
			...rule,
		})) satisfies RulesResponse,
	);
});
