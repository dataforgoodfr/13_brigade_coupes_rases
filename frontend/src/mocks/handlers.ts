import {
	mockClearCutting,
	mockClearCuttingsResponse,
} from "@/mocks/clear-cuttings";
import { mockFilters } from "@/mocks/filters";
import { mockReferential } from "@/mocks/referential";
import { mockLogin, mockUsers } from "@/mocks/users";

export const handlers = [
	mockClearCuttingsResponse(undefined, true),
	mockFilters,
	mockLogin,
	mockFilters,
	mockUsers,
	mockReferential,
	mockClearCutting(),
];
