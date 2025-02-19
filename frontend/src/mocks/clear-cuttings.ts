import type {
	ClearCuttingPreview,
	ClearCuttingsResponse,
} from "@/features/clear-cutting/store/clear-cuttings";
import type { FiltersResponse } from "@/features/clear-cutting/store/filters";
import { range } from "@/shared/array";
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
export const mockClearCuttings = http.get("*/clear-cuttings", () => {
	return HttpResponse.json({
		clearCuttingPreviews: [
			createClearCutting(),
			createClearCutting(),
			createClearCutting(),
			createClearCutting(),
			createClearCutting(),
			createClearCutting(),
			createClearCutting(),
			createClearCutting(),
		],
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
const createFranceRandomPoints = range<[number, number]>(
	500,
	francRandomPointMock,
);
const createClearCutting = (): ClearCuttingPreview => ({
	center: francRandomPointMock(),
	address: {
		city: faker.location.city(),
		country: faker.location.country(),
		postalCode: faker.location.zipCode(),
	},
	status: "validated",
	name: faker.animal.dog(),
	cutYear: 2021,
	id: faker.string.uuid(),
	imagesCnt: faker.number.int() % 10,
	imageUrl: faker.image.url(),
	geoCoordinates: [],
});
