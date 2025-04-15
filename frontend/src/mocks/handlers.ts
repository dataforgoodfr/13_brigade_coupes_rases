import { mockClearCut, mockClearCutsResponse } from "@/mocks/clear-cuts";
import { mockFilters } from "@/mocks/filters";
import { mockReferential } from "@/mocks/referential";
import { mockMe, mockToken, mockUsers } from "@/mocks/users";

export const handlers = [
	mockClearCutsResponse(undefined, true),
	mockFilters,
	mockMe,
	mockToken,
	mockFilters,
	mockUsers,
	mockReferential,
	mockClearCut().handler,
];
