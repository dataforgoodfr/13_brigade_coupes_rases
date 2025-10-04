import { faker } from "@faker-js/faker";
import { HttpResponse, http } from "msw";
import {
	type ClearCutFormResponse,
	type ClearCutFormsResponse,
	clearCutFormResponseSchema,
} from "@/features/clear-cut/store/clear-cuts";
import { createPaginationOneElementMock } from "@/mocks/pagination";

export const mockClearCutFormsResponse = (
	override: Partial<ClearCutFormResponse> = {},
) => {
	const createdAt = faker.date.recent();
	const clearCut: ClearCutFormResponse = clearCutFormResponseSchema.parse({
		id: faker.string.uuid(),
		etag: createdAt.getTime().toString(10),
		reportId: faker.string.uuid(),
		createdAt: createdAt.toJSON(),
		clearCutImages: [],
		hasRemainingTrees: false,
		plantingImages: [],
		hasConstructionPanel: false,
		treeTrunksImages: [],
		soilStateImages: [],
		accessRoadImages: [],
		hasOtherEcologicalZone: false,
		hasNearbyEcologicalZone: false,
		hasDdtRequest: false,
		relevantForPefcComplaint: false,
		relevantForRediiiComplaint: false,
		relevantForOfbComplaint: false,
		relevantForAlertCnpfDdtSrgs: false,
		relevantForAlertCnpfDdtPsgThresholds: false,
		relevantForPsgRequest: false,
		...override,
	} as ClearCutFormResponse);
	return {
		handler: http.get("*/api/v1/clear-cuts-reports/:id/forms", ({ params }) => {
			const { id } = params as { id: string };
			return HttpResponse.json(
				createPaginationOneElementMock({
					...clearCut,
					reportId: id,
				}) satisfies ClearCutFormsResponse,
			);
		}),
		response: clearCut,
	};
};
