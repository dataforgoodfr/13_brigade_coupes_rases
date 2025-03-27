import {
	mockClearCutting,
	mockClearCuttingsResponse,
} from "@/mocks/clear-cuttings";
import { mockFilters } from "@/mocks/filters";
import { mockReferential } from "@/mocks/referential";
import { mockMe, mockToken, mockUsers } from "@/mocks/users";

export const handlers = [
	mockClearCuttingsResponse(undefined, true),
	mockFilters,
	mockMe,
	mockToken,
	mockFilters,
	mockUsers,
	mockReferential,
	mockClearCutting(),
];
