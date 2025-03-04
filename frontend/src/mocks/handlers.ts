import { mockClearCutting, mockClearCuttings } from "@/mocks/clear-cuttings";
import { mockFilters } from "@/mocks/filters";
import { mockReferential } from "@/mocks/referential";
import { mockLogin, mockUsers } from "@/mocks/users";

export const handlers = [
	mockClearCuttings,
	mockFilters,
	mockLogin,
	mockFilters,
	mockUsers,
	mockReferential,
	mockClearCutting(),
];
