import {
	mockClearCutReportResponse,
	mockClearCutsResponse,
} from "@/mocks/clear-cuts";
import { mockClearCutFormsResponse } from "@/mocks/clear-cuts-forms";
import { mockFilters } from "@/mocks/filters";
import { mockReferential } from "@/mocks/referential";
import { mockRules } from "@/mocks/rules";
import { mockMe, mockToken, mockUsers } from "@/mocks/users";

export const handlers = [
	mockClearCutsResponse(undefined, true),
	mockFilters,
	mockMe,
	mockToken,
	mockFilters,
	mockUsers,
	mockReferential,
	mockRules,
	mockClearCutReportResponse().handler,
	mockClearCutFormsResponse().handler,
];
