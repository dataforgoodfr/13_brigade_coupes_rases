import type {
	ClearCuttingPreview,
	ClearCuttingStatus,
	ClearCuttingsResponse,
} from "@/features/clear-cutting/store/clear-cuttings";
import type { FiltersResponse } from "@/features/clear-cutting/store/filters";
import { range } from "@/shared/array";
import { type Boundaries, isPointInsidePolygon } from "@/shared/geometry";
import { faker } from "@faker-js/faker";
import { http, HttpResponse } from "msw";

export const mockFilters = http.get("*/filters", () => {
	return HttpResponse.json({
		cutYears: [2021, 2022],
		tags: [
			{
				isAbusive: true,
				name: "Supérieur à 10 hectares",
				id: faker.string.uuid(),
			},
		],
		ecologicalZoning: {
			[faker.string.uuid()]: faker.company.buzzAdjective(),
		},
		status: {},
		departments: {},
		region: {},
	} satisfies FiltersResponse);
});

export const mockClearCuttings = http.get("*/clear-cuttings", ({ request }) => {
	const url = new URL(request.url);
	const geoBoundsQueryString = url.searchParams.get("geoBounds");
	let boundaries: Boundaries | undefined;

	if (geoBoundsQueryString) {
		const geoBounds = geoBoundsQueryString.split(",").map(Number.parseFloat);
		boundaries = [
			[geoBounds[0], geoBounds[1]],
			[geoBounds[0], geoBounds[3]],
			[geoBounds[2], geoBounds[3]],
			[geoBounds[2], geoBounds[1]],
		];
	}

	const clearCuttingPreviews = createFranceRandomPoints.map(createClearCutting);

	return HttpResponse.json({
		clearCuttingPreviews: boundaries
			? clearCuttingPreviews.filter((ccp) =>
					isPointInsidePolygon(boundaries, ccp.center),
				)
			: clearCuttingPreviews,
		clearCuttingsPoints: createFranceRandomPoints,
		ecologicalZoning: [],
		waterCourses: [],
	} satisfies ClearCuttingsResponse);
});

const francRandomPointMock = (): [number, number] => [
	faker.location.latitude({
		min: 43.883918307385926,
		max: 49.33292664908802,
	}),
	faker.location.longitude({
		min: -0.3899356021470268,
		max: 5.666435865557435,
	}),
];

const randomPolygonFromLocation = (
	point: [number, number],
	radius = 10,
	size = 10,
): [number, number][] => {
	if (size < 3) {
		throw new Error(
			"Invalid polygon size: maximum polygon size can not be less than 3",
		);
	}

	if (radius <= 0) {
		throw new Error("Invalid radius size: must be grater to 0");
	}

	const earthRadius = 6371; // Earth radius
	const polygon: [number, number][] = [];
	const angleStep = (2 * Math.PI) / size;

	for (let i = 0; i < size; i++) {
		const angle = i * angleStep;

		const deltaLat = (radius / earthRadius) * (180 / Math.PI) * Math.sin(angle);
		const deltaLng =
			((radius / earthRadius) * (180 / Math.PI) * Math.cos(angle)) /
			Math.cos((point[0] * Math.PI) / 180);

		polygon.push([point[0] + deltaLat, point[1] + deltaLng]);
	}

	return polygon;
};

const createFranceRandomPoints = range<[number, number]>(
	500,
	francRandomPointMock,
);

const getRandomStatus = (seed: number) =>
	["validated", "toValidate", "rejected", "waitingInformation"][
		seed % 4
	] as ClearCuttingStatus;

const createClearCutting = (center: [number, number]): ClearCuttingPreview => {
	const name = faker.animal.dog();
	const city = faker.location.city();

	return {
		center,
		name,
		address: {
			city,
			country: faker.location.country(),
			postalCode: faker.location.zipCode(),
		},
		status: getRandomStatus(Math.floor(center[0] + center[1])),
		cutYear: 2021,
		id: faker.string.uuid(),
		imagesCnt: faker.number.int() % 10,
		imageUrl: faker.image.url(),
		geoCoordinates: randomPolygonFromLocation(center, 3.5, 7),
	};
};
