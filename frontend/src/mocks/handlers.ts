import {
	mockClearCut,
	mockClearCutFormsResponse,
	mockClearCutsResponse,
} from "@/mocks/clear-cuts";
import { mockFilters } from "@/mocks/filters";
import { mockReferential } from "@/mocks/referential";
import { mockRules } from "@/mocks/rules";
import { mockMe, mockToken, mockUsers } from "@/mocks/users";

export const handlers = [
	mockClearCutsResponse(undefined, true),
	mockClearCutFormsResponse(),
	mockFilters,
	mockMe,
	mockToken,
	mockFilters,
	mockUsers,
	mockReferential,
	mockRules,
	mockClearCut().handler,
];
