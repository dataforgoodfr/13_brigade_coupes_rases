import {
	CLEAR_CUTTING_STATUSES,
	type ClearCutFormResponse,
	type ClearCutReportResponse,
	type ClearCutResponse,
	type ClearCutsResponse,
	type MultiPolygon,
	type Point,
} from "@/features/clear-cut/store/clear-cuts";
import {
	fakeDepartments,
	fakeEcologicalZonings,
	fakeRules,
} from "@/mocks/referential";
import { volunteerAssignedToken } from "@/mocks/users";
import { range } from "@/shared/array";
import { type Boundaries, isPointInsidePolygon } from "@/shared/geometry";
import { faker } from "@faker-js/faker";
import { http, HttpResponse } from "msw";

export const createClearCutResponseMock = (
	override: Partial<ClearCutResponse> = {},
): ClearCutResponse => {
	const startDate = faker.date.anytime();
	const location = override.location ?? franceRandomPointMock();
	const endDate = new Date(startDate);
	endDate.setMonth(
		startDate.getMonth() + faker.number.int({ min: 1, max: 12 }),
	);
	return {
		id: faker.string.uuid(),
		boundary: randomMultiPolygonFromLocation(location.coordinates, 3.5, 7),
		ecological_zoning_ids: faker.helpers.arrayElements(
			Object.keys(fakeEcologicalZonings),
		),
		observation_start_date: startDate.toJSON().split("T")[0],
		observation_end_date: endDate.toJSON().split("T")[0],
		area_hectare: faker.number.int({ min: 5, max: 20 }),
		location,
		...override,
	};
};
export const createClearCutReportBaseMock = (
	override: Partial<ClearCutReportResponse> = {},
): ClearCutReportResponse => {
	const date = faker.date.anytime();
	const randomLocation = franceRandomPointMock();
	const clear_cuts = [
		...range<ClearCutResponse>(1, () =>
			createClearCutResponseMock({
				location: override.average_location ?? randomLocation,
			}),
		),
		...(override.clear_cuts ?? []),
	];
	const total_area_hectare = clear_cuts.reduce(
		(acc, cut) => acc + cut.area_hectare,
		0,
	);
	return {
		id: faker.string.uuid(),
		average_location: override.average_location ?? randomLocation,
		name: faker.animal.dog(),
		comment: faker.lorem.paragraph(),
		department_id: faker.helpers.arrayElement(Object.keys(fakeDepartments)),
		city: faker.location.city(),
		created_at: faker.date.past().toJSON().split("T")[0],
		slope_area_ratio_percentage: faker.number.int({ min: 1, max: 60 }),
		status: faker.helpers.arrayElement(CLEAR_CUTTING_STATUSES),
		rules_ids: faker.helpers.arrayElements(Object.keys(fakeRules)),
		total_area_hectare,
		total_bdf_deciduous_area_hectare: faker.number.float({
			max: total_area_hectare / 4,
		}),
		total_bdf_mixed_area_hectare: faker.number.float({
			max: total_area_hectare / 4,
		}),
		total_bdf_poplar_area_hectare: faker.number.float({
			max: total_area_hectare / 4,
		}),
		total_bdf_resinous_area_hectare: faker.number.float({
			max: total_area_hectare / 4,
		}),
		clear_cuts,
		last_cut_date: clear_cuts.reduce(
			(acc, cut) =>
				cut.observation_end_date > acc ? cut.observation_end_date : acc,
			clear_cuts[0].observation_end_date,
		),
		updated_at: date.toJSON().split("T")[0],
		...override,
	};
};
export const mockClearCut = (override: Partial<ClearCutFormResponse> = {}) => {
	const clearCut = {
		...createClearCutReportBaseMock(),
		imageUrls: [],
		imgSatelliteCC: faker.image.url(),

		onSiteDate: faker.date.anytime().toISOString(),
		isPlantationPresentACC: false,
		imgsPlantation: [],
		isWorksiteSignPresent: false,
		imgsTreeTrunks: [],
		imgsSoilState: [],
		imgsAccessRoad: [],

		isNatura2000: false,
		isOtherEcoZone: false,
		isNearEcoZone: false,
		isDDT: false,

		isCCOrCompanyCertified: null,
		isMoreThan20ha: null,
		isSubjectToPSG: null,

		isRelevantComplaintPEFC: false,
		isRelevantComplaintREDIII: false,
		isRelevantComplaintOFB: false,
		isRelevantAlertSRGS: false,
		isRelevantAlertPSG: false,
		isRelevantRequestPSG: false,

		...override,
	} satisfies ClearCutFormResponse;
	return {
		handler: http.get("*/api/v1/clear-cuts-map/:id", ({ params, request }) => {
			const { id } = params as { id: string };
			const token = request.headers.get("Authorization");
			if (token?.includes(volunteerAssignedToken)) {
				clearCut.assignedUser = "assignedVolunteer";
			}
			return HttpResponse.json({
				...clearCut,
				id: override.id ?? id,
			} satisfies ClearCutFormResponse);
		}),
		response: clearCut,
	};
};

const franceRandomPointMock = (): Point => ({
	type: "Point",
	coordinates: [
		faker.location.longitude({
			min: -0.3899356021470268,
			max: 5.666435865557435,
		}),
		faker.location.latitude({
			min: 43.883918307385926,
			max: 49.33292664908802,
		}),
	],
});
const randomMultiPolygonFromLocation = (
	point: [number, number],
	radius = 10,
	size = 10,
): MultiPolygon => {
	if (size < 3) {
		throw new Error(
			"Invalid polygon size: maximum polygon size can not be less than 3",
		);
	}

	if (radius <= 0) {
		throw new Error("Invalid radius size: must be grater to 0");
	}

	const earthRadius = 6371; // Earth radius
	const coordinates: [number, number][] = [];
	const angleStep = (2 * Math.PI) / size;

	for (let i = 0; i < size; i++) {
		const angle = i * angleStep;

		const deltaLat = (radius / earthRadius) * (180 / Math.PI) * Math.sin(angle);
		const deltaLng =
			((radius / earthRadius) * (180 / Math.PI) * Math.cos(angle)) /
			Math.cos((point[1] * Math.PI) / 180);

		coordinates.push([point[0] + deltaLng, point[1] + deltaLat]);
	}

	return { type: "MultiPolygon", coordinates: [[coordinates]] };
};

const randomPoints = range<Point>(100, franceRandomPointMock);

const clearCutPreviews = randomPoints.map((center) =>
	createClearCutReportBaseMock({ average_location: center }),
);

export const mockClearCutsResponse = (
	override: Partial<ClearCutsResponse> = {},
	filterInArea = false,
) =>
	http.get("*/api/v1/clear-cuts-map", ({ request }) => {
		const url = new URL(request.url);
		const southWestLat = url.searchParams.get("sw_lat");
		const southWestLng = url.searchParams.get("sw_lng");
		const northEastLat = url.searchParams.get("ne_lat");
		const northEastLng = url.searchParams.get("ne_lng");
		let boundaries: Boundaries | undefined;
		const previews = [...(override.previews ?? []), ...clearCutPreviews];
		if (southWestLat && southWestLng && northEastLat && northEastLng) {
			boundaries = [
				[Number.parseFloat(southWestLng), Number.parseFloat(southWestLat)],
				[Number.parseFloat(northEastLng), Number.parseFloat(southWestLat)],
				[Number.parseFloat(northEastLng), Number.parseFloat(northEastLat)],
				[Number.parseFloat(southWestLng), Number.parseFloat(northEastLat)],
			];
		}
		return HttpResponse.json({
			previews:
				boundaries && filterInArea
					? previews.filter((ccp) =>
							isPointInsidePolygon(
								boundaries,
								ccp.average_location.coordinates,
							),
						)
					: previews,
			points:
				boundaries && filterInArea
					? randomPoints.filter((point) =>
							isPointInsidePolygon(boundaries, point.coordinates),
						)
					: randomPoints,
		} satisfies ClearCutsResponse);
	});
