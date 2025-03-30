import {
	CLEAR_CUTTING_STATUSES,
	type ClearCuttingBaseResponse,
	type ClearCuttingPreviewResponse,
	type ClearCuttingsResponse,
	type MultiPolygon,
	type Point,
} from "@/features/clear-cutting/store/clear-cuttings";
import { fakeEcologicalZonings, fakeTags } from "@/mocks/referential";
import { range } from "@/shared/array";
import { type Boundaries, isPointInsidePolygon } from "@/shared/geometry";
import { faker } from "@faker-js/faker";
import { http, HttpResponse } from "msw";

export const createClearCuttingBaseMock = (
	override: Partial<ClearCuttingBaseResponse> = {},
): ClearCuttingBaseResponse => {
	const date = faker.date.anytime();
	const center = override.location ?? franceRandomPointMock();
	return {
		id: faker.string.uuid(),
		boundary: randomMultiPolygonFromLocation(center.coordinates, 3.5, 7),
		location: center,
		name: faker.animal.dog(),
		comment: faker.lorem.paragraph(),
		ecological_zoning_ids: faker.helpers.arrayElements(
			Object.keys(fakeEcologicalZonings),
		),
		cities: faker.helpers.arrayElements([
			faker.location.city(),
			faker.location.city(),
		]),
		created_at: faker.date.past().toJSON(),
		slope_percentage: faker.number.int({ min: 1, max: 60 }),
		status: faker.helpers.arrayElement(CLEAR_CUTTING_STATUSES),
		tags_ids: faker.helpers.arrayElements(Object.keys(fakeTags)),
		cut_date: date.toJSON().split("T")[0],
		area_hectare: faker.number.int({ min: 5, max: 20 }),
		...override,
	};
};

export const mockClearCutting = (
	clearCutting: Partial<ClearCuttingBaseResponse> = {},
) =>
	http.get("*/api/v1/clearcuts/reports/:id", ({ params }) => {
		const { id } = params as { id: string };
		return HttpResponse.json({
			...createClearCuttingBaseMock(),
			id: id,
			...clearCutting,
		} satisfies ClearCuttingBaseResponse);
	});

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
			Math.cos((point[0] * Math.PI) / 180);

		coordinates.push([point[1] + deltaLng, point[0] + deltaLat]);
	}

	return { type: "MultiPolygon", coordinates: [[coordinates]] };
};

const createFranceRandomPoints = range<Point>(500, franceRandomPointMock);

export const createClearCuttingPreviewResponse = (
	override: Partial<ClearCuttingPreviewResponse> = {
		location: franceRandomPointMock(),
	},
): ClearCuttingPreviewResponse => {
	const city = faker.location.city();
	return {
		...createClearCuttingBaseMock({ location: override.location }),
		cities: [city],
		...override,
	};
};

const clearCuttingPreviews = createFranceRandomPoints
	.slice(0, 50)
	.map((center) => createClearCuttingPreviewResponse({ location: center }));

export const mockClearCuttingsResponse = (
	override: Partial<ClearCuttingsResponse> = {},
	filterInArea = false,
) =>
	http.get("*/api/v1/clearcuts-map", ({ request }) => {
		const url = new URL(request.url);
		const southWestLat = url.searchParams.get("swLat");
		const southWestLng = url.searchParams.get("swLng");
		const northEastLat = url.searchParams.get("neLat");
		const northEastLng = url.searchParams.get("neLng");
		let boundaries: Boundaries | undefined;
		const previews = [...(override.previews ?? []), ...clearCuttingPreviews];
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
							isPointInsidePolygon(boundaries, ccp.location.coordinates),
						)
					: previews,
			points: createFranceRandomPoints,
		} satisfies ClearCuttingsResponse);
	});
