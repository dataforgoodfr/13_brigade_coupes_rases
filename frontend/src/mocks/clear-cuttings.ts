import type {
	ClearCuttingAddress,
	ClearCuttingPreviewResponse,
	ClearCuttingResponse,
	ClearCutting,
	ClearCuttingsResponse,
} from "@/features/clear-cutting/store/clear-cuttings";
import { CLEAR_CUTTING_STATUSES } from "@/features/clear-cutting/store/status";
import { fakeTags } from "@/mocks/referential";
import { range } from "@/shared/array";
import { type Boundaries, isPointInsidePolygon } from "@/shared/geometry";
import { Tag } from "@/shared/store/referential/referential";
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

export const generateAddressMock = (
	address: Partial<ClearCuttingAddress> = {},
) =>
	({
		streetName: faker.location.street(),
		streetNumber: faker.number.int().toString(),
		postalCode: faker.location.zipCode(),
		city: faker.location.city(),
		country: "France",
		...address,
	}) satisfies ClearCuttingAddress;
export const mockClearCutting = (
	clearCutting: Partial<ClearCutting> = {},
) =>
	http.get("*/clear-cuttings/:id", ({ params }) => {
		const { id } = params as { id: string };
		const date = faker.date.anytime();
		const center = francRandomPointMock();
		return HttpResponse.json({
			id: id,
			geoCoordinates: [center],
			address: generateAddressMock(),
			imageUrls: [],
			status: faker.helpers.arrayElement(CLEAR_CUTTING_STATUSES),
			abusiveTags: faker.helpers.arrayElements(Object.keys(fakeTags)),
			center,
			creationDate: date.toISOString(),
			cutYear: date.getFullYear(),
			ecologicalZones: [],
			reportDate: date.toISOString(),
			clearCuttingSize: faker.number.int(200),
			clearCuttingSlope: faker.number.int(100),
			imgSatelliteCC:faker.image.url(),

			onSiteDate: faker.date.anytime().toISOString(),
			assignedUser: null,
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
			
			...clearCutting,
		} satisfies ClearCuttingResponse);
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

const createClearCutting = (
	center: [number, number],
): ClearCuttingPreviewResponse => {
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
		comment: faker.lorem.paragraph(),
		status: faker.helpers.arrayElement(CLEAR_CUTTING_STATUSES),
		cutYear: 2021,
		reportDate: faker.date.anytime().toLocaleDateString(),
		creationDate: faker.date.anytime().toLocaleDateString(),
		id: faker.string.uuid(),
		imagesCnt: faker.number.int() % 10,
		naturaZone: faker.string.fromCharacters(naturaZones),
		cadastralParcel: {
			id: faker.string.nanoid(),
			slope: faker.number.int({ min: 1, max: 60 }),
			surfaceKm: faker.number.int({ min: 5, max: 500 }),
		},
		abusiveTags: faker.helpers.arrayElements(Object.keys(fakeTags)),
		ecologicalZones: [],
		geoCoordinates: randomPolygonFromLocation(center, 3.5, 7),
	};
};

const clearCuttingPreviews = createFranceRandomPoints.map(createClearCutting);

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

	return HttpResponse.json({
		clearCuttingPreviews: boundaries
			? clearCuttingPreviews.filter((ccp) =>
					isPointInsidePolygon(boundaries, ccp.center),
				)
			: clearCuttingPreviews,
		clearCuttingsPoints: createFranceRandomPoints,
		ecologicalZones: [],
		waterCourses: [],
	} satisfies ClearCuttingsResponse);
});
