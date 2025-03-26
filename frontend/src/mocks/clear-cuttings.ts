import type {
	ClearCuttingAddress,
	ClearCuttingBaseResponse,
	ClearCuttingPreviewResponse,
	ClearCuttingResponse,
	ClearCuttingsResponse,
} from "@/features/clear-cutting/store/clear-cuttings";
import { fakeStatuses, fakeTags } from "@/mocks/referential";
import { range } from "@/shared/array";
import { type Boundaries, isPointInsidePolygon } from "@/shared/geometry";
import { faker } from "@faker-js/faker";
import { http, HttpResponse } from "msw";

const naturaZones = [
	"",
	"",
	"",
	"",
	"DES_SITE",
	"Les grands prés",
	"Site classé de la Haute Vallée de l'Essonne",
	"Gâtinais français",
	"Vallée du Fusain",
	"ETANG DE SAINT QUENTIN",
	"MARAIS DITTEVILLE ET DE FONTENAY LE VICOMTE",
	"Charmentray - Trilbardou",
	"Massif de Rambouillet",
	"Vallée de Chevreuse",
	"Cinq étangs et leurs abords",
	"Vallée de Chevreuse",
	"Haute vallée de Chevreuse",
	"Boucle de Guerne",
	"Boucle de la Seine",
	"Forêt de Rosny",
	"Falaises de la Roche-Guyon et forêt de Moisson",
	"Vexin français",
	"Parc forestier de Sevran et ses abords ",
	"Alisiers du plateau d'Avron",
	"Bois de Bernouille",
	"Mares du plateau d'Avron",
	"Pointe de Givet",
	"Roche à Wagne",
	"Rochers du petit Chooz",
	"Rochers et falaises de Charlemont",
	"Etangs de la Champagne humide",
	"Forêt d'Orient",
	"Rièze de la croix Sainte-Anne",
	"Marais de la Vanne",
	"Montagne de Reims",
	"Forêt d'Orient",
	"Etangs de la Champagne humide",
	"Forêt d'Orient",
	"Etangs de la Champagne humide",
	"Forêt d'Orient",
	"Montagne de Reims",
	"Etangs de la Champagne humide",
	"Fontaine couverte et perte de l'Andousoir",
	"Forêt d'Orient",
];

export const createClearCuttingBaseMock = (
	override: Partial<ClearCuttingBaseResponse> = {},
): ClearCuttingBaseResponse => {
	const date = faker.date.anytime();
	const center = override.center ?? franceRandomPointMock();
	return {
		id: faker.string.uuid(),
		geoCoordinates: randomPolygonFromLocation(center, 3.5, 7),
		center,
		name: faker.animal.dog(),
		comment: faker.lorem.paragraph(),
		naturaZone: faker.string.fromCharacters(naturaZones),
		slopePercent: faker.number.int({ min: 1, max: 60 }),
		status: faker.helpers.arrayElement(Object.keys(fakeStatuses)),
		abusiveTags: faker.helpers.arrayElements(Object.keys(fakeTags)),
		creationDate: date.toLocaleDateString(),
		cutYear: date.getFullYear(),
		ecologicalZones: [],
		reportDate: date.toLocaleDateString(),
		surfaceHectare: faker.number.int({ min: 5, max: 20 }),
		...override,
	};
};

export const createAddressMock = (address: Partial<ClearCuttingAddress> = {}) =>
	({
		streetName: faker.location.street(),
		streetNumber: faker.number.int().toString(),
		postalCode: faker.location.zipCode(),
		city: faker.location.city(),
		country: "France",
		...address,
	}) satisfies ClearCuttingAddress;

export const mockClearCutting = (
	clearCutting: Partial<ClearCuttingResponse> = {},
) =>
	http.get("*/clear-cuttings/:id", ({ params }) => {
		const { id } = params as { id: string };
		return HttpResponse.json({
			...createClearCuttingBaseMock(),
			id: id,
			address: createAddressMock(),
			imageUrls: [],
			...clearCutting,
		} satisfies ClearCuttingResponse);
	});

const franceRandomPointMock = (): [number, number] => [
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
	franceRandomPointMock,
);

export const createClearCuttingPreviewResponse = (
	override: Partial<ClearCuttingPreviewResponse> = {
		center: franceRandomPointMock(),
	},
): ClearCuttingPreviewResponse => {
	const city = faker.location.city();
	return {
		...createClearCuttingBaseMock({ center: override.center }),
		address: {
			city,
			country: faker.location.country(),
			postalCode: faker.location.zipCode(),
		},
		imagesCnt: faker.number.int() % 10,
		...override,
	};
};

const clearCuttingPreviews = createFranceRandomPoints
	.slice(0, 50)
	.map((center) => createClearCuttingPreviewResponse({ center }));

export const mockClearCuttingsResponse = (
	override: Partial<ClearCuttingsResponse> = {},
	filterInArea = false,
) =>
	http.get("*/clear-cuttings", ({ request }) => {
		const url = new URL(request.url);
		const southWestLat = url.searchParams.get("swLat");
		const southWestLng = url.searchParams.get("swLng");
		const northEastLat = url.searchParams.get("neLat");
		const northEastLng = url.searchParams.get("neLng");
		let boundaries: Boundaries | undefined;
		const previews = [
			...(override.previews ?? []),
			...clearCuttingPreviews,
		];
		if (southWestLat && southWestLng && northEastLat && northEastLng) {
			boundaries = [
				[Number.parseFloat(southWestLat), Number.parseFloat(southWestLng)],
				[Number.parseFloat(southWestLat), Number.parseFloat(northEastLng)],
				[Number.parseFloat(northEastLat), Number.parseFloat(northEastLng)],
				[Number.parseFloat(northEastLat), Number.parseFloat(southWestLng)],
			];
		}
		return HttpResponse.json({
			previews:
				boundaries && filterInArea
					? previews.filter((ccp) =>
							isPointInsidePolygon(boundaries, ccp.center),
						)
					: previews,
			points: createFranceRandomPoints,
			ecologicalZones: [],
			waterCourses: [],
		} satisfies ClearCuttingsResponse);
	});
