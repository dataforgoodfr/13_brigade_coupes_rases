import {
	CLEAR_CUTTING_STATUSES,
	type ClearCutReportResponse,
	type ClearCutResponse,
	type ClearCutsResponse,
	type MultiPolygon,
	type Point,
	type PublicUser,
} from "@/features/clear-cut/store/clear-cuts";
import {
	fakeDepartments,
	fakeEcologicalZonings,
	fakeRules,
} from "@/mocks/referential";
import { volunteerAssignedMock, volunteerAssignedToken } from "@/mocks/users";
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
		ecologicalZoningIds: faker.helpers.arrayElements(
			Object.keys(fakeEcologicalZonings),
		),
		observationStartDate: startDate.toJSON().split("T")[0],
		observationEndDate: endDate.toJSON().split("T")[0],
		areaHectare: faker.number.int({ min: 5, max: 20 }),
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
				location: override.averageLocation ?? randomLocation,
			}),
		),
		...(override.clearCuts ?? []),
	];
	const total_area_hectare = clear_cuts.reduce(
		(acc, cut) => acc + cut.areaHectare,
		0,
	);
	return {
		id: faker.string.uuid(),
		averageLocation: override.averageLocation ?? randomLocation,
		name: faker.animal.dog(),
		comment: faker.lorem.paragraph(),
		departmentId: faker.helpers.arrayElement(Object.keys(fakeDepartments)),
		city: faker.location.city(),
		createdAt: faker.date.past().toJSON().split("T")[0],
		slopeAreaHectare: faker.number.float({ min: 0, max: total_area_hectare }),
		status: faker.helpers.arrayElement(CLEAR_CUTTING_STATUSES),
		rulesIds: faker.helpers.arrayElements(Object.keys(fakeRules)),
		totalAreaHectare: total_area_hectare,
		totalBdfDeciduousAreaHectare: faker.number.float({
			max: total_area_hectare / 4,
		}),
		totalBdfMixedAreaHectare: faker.number.float({
			max: total_area_hectare / 4,
		}),
		totalBdfPoplarAreaHectare: faker.number.float({
			max: total_area_hectare / 4,
		}),
		totalBdfResinousAreaHectare: faker.number.float({
			max: total_area_hectare / 4,
		}),
		clearCuts: clear_cuts,
		lastCutDate: clear_cuts.reduce(
			(acc, cut) =>
				cut.observationEndDate > acc ? cut.observationEndDate : acc,
			clear_cuts[0].observationEndDate,
		),
		updatedAt: date.toJSON().split("T")[0],
		...override,
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
	createClearCutReportBaseMock({ averageLocation: center }),
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
		const points =
			boundaries && filterInArea
				? randomPoints.filter((point) =>
						isPointInsidePolygon(boundaries, point.coordinates),
					)
				: randomPoints;
		return HttpResponse.json({
			previews:
				boundaries && filterInArea
					? previews.filter((ccp) =>
							isPointInsidePolygon(boundaries, ccp.averageLocation.coordinates),
						)
					: previews,
			points: {
				content: points.map((p) => ({ count: 1, point: p })),
				total: points.length,
			},
		} satisfies ClearCutsResponse);
	});

export const mockClearCutReportResponse = (
	override: Partial<ClearCutReportResponse> = {},
) => {
	const baseMock = createClearCutReportBaseMock(override);
	return {
		handler: http.get(
			"*/api/v1/clear-cuts-reports/:id",
			({ params, request }) => {
				const { id } = params as { id: string };
				const authHeader = request.headers.get("Authorization");
				let affectedUser: PublicUser | undefined;
				if (authHeader?.includes(volunteerAssignedToken)) {
					affectedUser = volunteerAssignedMock;
				}
				return HttpResponse.json({
					...baseMock,
					id,
					affectedUser,
				} satisfies ClearCutReportResponse);
			},
		),
		response: baseMock,
	};
};
