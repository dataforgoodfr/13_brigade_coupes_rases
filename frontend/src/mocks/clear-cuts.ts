import { fakerFR as faker } from "@faker-js/faker"
import { HttpResponse, http } from "msw"

import {
	CLEAR_CUTTING_STATUSES,
	type ClearCutReportResponse,
	type ClearCutResponse,
	type ClearCutsResponse,
	type MultiPolygon,
	type Point,
	type PublicUser
} from "@/features/clear-cut/store/clear-cuts"
import {
	fakeDepartments,
	fakeEcologicalZonings,
	fakeRules
} from "@/mocks/referential"
import { volunteerAssignedMock, volunteerAssignedToken } from "@/mocks/users"
import { range } from "@/shared/array"
import { type Boundaries, isPointInsidePolygon } from "@/shared/geometry"

type ClearCutResponseMockOptions = { ecologicalZoningsCount?: number }

export const createClearCutResponseMock = (
	override: Partial<ClearCutResponse> = {},
	options: ClearCutResponseMockOptions = {}
): ClearCutResponse => {
	// Alerts reach the tool a few weeks to a few months after the cut
	const startDate = faker.date.past({ years: 2 })
	const location = override.location ?? franceRandomPointMock()
	const endDate = faker.date.between({ from: startDate, to: Date.now() })
	return {
		id: faker.string.uuid(),
		// About 12 ha, the size of a typical clear cut
		boundary: randomMultiPolygonFromLocation(location.coordinates, 0.2, 7),
		ecologicalZoningIds: faker.helpers.arrayElements(
			Object.keys(fakeEcologicalZonings),
			options.ecologicalZoningsCount
		),
		observationStartDate: startDate.toJSON().split("T")[0],
		observationEndDate: endDate.toJSON().split("T")[0],
		areaHectare: faker.number.int({ min: 5, max: 20 }),
		location,
		...override
	}
}
type ClearCutReportResponseMockOptions = {
	clearCutsCount?: number
} & ClearCutResponseMockOptions
export const createClearCutReportResponseBaseMock = (
	override: Partial<ClearCutReportResponse> = {},
	options: ClearCutReportResponseMockOptions = {}
): ClearCutReportResponse => {
	const date = faker.date.recent({ days: 60 })
	const randomLocation = franceRandomPointMock()
	const forest = forestOf(override.averageLocation ?? randomLocation)
	const clear_cuts = [
		...range<ClearCutResponse>(options.clearCutsCount ?? 1, () =>
			createClearCutResponseMock(
				{
					location: override.averageLocation ?? randomLocation
				},
				options
			)
		),
		...(override.clearCuts ?? [])
	]
	const total_area_hectare = clear_cuts.reduce(
		(acc, cut) => acc + cut.areaHectare,
		0
	)
	return {
		id: faker.string.uuid(),
		averageLocation: override.averageLocation ?? randomLocation,
		name: faker.animal.dog(),
		departmentId: departmentIdOf(forest.department),
		city: faker.helpers.arrayElement(forest.cities),
		createdAt: faker.date.past().toJSON().split("T")[0],
		slopeAreaHectare: faker.number.float({ min: 0, max: total_area_hectare }),
		status: faker.helpers.arrayElement(CLEAR_CUTTING_STATUSES),
		rulesIds: faker.helpers.arrayElements(Object.keys(fakeRules)),
		totalAreaHectare: total_area_hectare,
		totalBdfDeciduousAreaHectare: faker.number.float({
			max: total_area_hectare / 4
		}),
		totalBdfMixedAreaHectare: faker.number.float({
			max: total_area_hectare / 4
		}),
		totalBdfPoplarAreaHectare: faker.number.float({
			max: total_area_hectare / 4
		}),
		totalBdfResinousAreaHectare: faker.number.float({
			max: total_area_hectare / 4
		}),
		clearCuts: clear_cuts,
		lastCutDate: clear_cuts.reduce(
			(acc, cut) =>
				cut.observationEndDate > acc ? cut.observationEndDate : acc,
			clear_cuts[0].observationEndDate
		),
		firstCutDate: clear_cuts.reduce(
			(acc, cut) =>
				cut.observationStartDate < acc ? cut.observationStartDate : acc,
			clear_cuts[0].observationStartDate
		),
		updatedAt: date.toJSON().split("T")[0],
		...override
	}
}

type Forest = {
	center: [number, number]
	department: string
	cities: string[]
}

/** Large French forests ([longitude, latitude]) where clear cuts are found */
export const FORESTS: Forest[] = [
	{
		center: [-0.9, 44.2],
		department: "Landes",
		cities: ["Mimizan", "Sabres", "Pissos", "Labouheyre"]
	},
	{
		center: [6.9, 48.2],
		department: "Vosges",
		cities: ["Gérardmer", "Bruyères", "Saint-Dié-des-Vosges"]
	},
	{
		center: [4.0, 47.15],
		department: "Nièvre",
		cities: ["Château-Chinon", "Montsauche-les-Settons", "Lormes"]
	},
	{
		center: [2.0, 45.6],
		department: "Corrèze",
		cities: ["Meymac", "Peyrelevade", "Bugeat"]
	},
	{
		center: [3.5, 44.6],
		department: "Lozère",
		cities: ["Le Malzieu-Ville", "Langogne", "Châteauneuf-de-Randon"]
	},
	{
		center: [6.0, 46.7],
		department: "Jura",
		cities: ["Champagnole", "Morez", "Nozeroy"]
	},
	{
		center: [1.9, 47.5],
		department: "Loir-et-Cher",
		cities: ["Lamotte-Beuvron", "Salbris", "Neung-sur-Beuvron"]
	},
	{
		center: [4.7, 49.85],
		department: "Ardennes",
		cities: ["Revin", "Monthermé", "Fumay"]
	},
	{
		center: [2.3, 43.45],
		department: "Tarn",
		cities: ["Mazamet", "Labruguière", "Arfons"]
	},
	{
		center: [2.1, 47.95],
		department: "Loiret",
		cities: ["Lorris", "Ingrannes", "Châteauneuf-sur-Loire"]
	}
]

const franceRandomPointMock = (): Point => {
	const [longitude, latitude] = faker.helpers.arrayElement(FORESTS).center
	return {
		type: "Point",
		coordinates: [
			longitude + faker.number.float({ min: -0.25, max: 0.25 }),
			latitude + faker.number.float({ min: -0.18, max: 0.18 })
		]
	}
}

/** The forest closest to the point */
const forestOf = ({ coordinates: [longitude, latitude] }: Point) => {
	const distance = ({ center }: Forest) =>
		(center[0] - longitude) ** 2 + (center[1] - latitude) ** 2
	return FORESTS.reduce((a, b) => (distance(b) < distance(a) ? b : a))
}

const departmentIdOf = (name: string) =>
	Object.entries(fakeDepartments).find(([, d]) => d.name === name)?.[0] ??
	faker.helpers.arrayElement(Object.keys(fakeDepartments))

const randomMultiPolygonFromLocation = (
	point: [number, number],
	radius = 10,
	size = 10
): MultiPolygon => {
	if (size < 3) {
		throw new Error(
			"Invalid polygon size: maximum polygon size can not be less than 3"
		)
	}

	if (radius <= 0) {
		throw new Error("Invalid radius size: must be grater to 0")
	}

	const earthRadius = 6371 // Earth radius
	const coordinates: [number, number][] = []
	const angleStep = (2 * Math.PI) / size

	for (let i = 0; i < size; i++) {
		const angle = i * angleStep

		const deltaLat = (radius / earthRadius) * (180 / Math.PI) * Math.sin(angle)
		const deltaLng =
			((radius / earthRadius) * (180 / Math.PI) * Math.cos(angle)) /
			Math.cos((point[1] * Math.PI) / 180)

		coordinates.push([point[0] + deltaLng, point[1] + deltaLat])
	}

	return { type: "MultiPolygon", coordinates: [[coordinates]] }
}

const randomPoints = range<Point>(100, franceRandomPointMock)

export const clearCutPreviews = randomPoints.map((center) =>
	createClearCutReportResponseBaseMock({ averageLocation: center })
)

export const mockClearCutsResponse = (
	override: Partial<ClearCutsResponse> = {},
	filterInArea = false
) =>
	http.get("*/api/v1/clear-cuts-map", ({ request }) => {
		const url = new URL(request.url)
		const southWestLat = url.searchParams.get("sw_lat")
		const southWestLng = url.searchParams.get("sw_lng")
		const northEastLat = url.searchParams.get("ne_lat")
		const northEastLng = url.searchParams.get("ne_lng")
		let boundaries: Boundaries | undefined
		const previews = [...(override.previews ?? []), ...clearCutPreviews]
		if (southWestLat && southWestLng && northEastLat && northEastLng) {
			boundaries = [
				[Number.parseFloat(southWestLng), Number.parseFloat(southWestLat)],
				[Number.parseFloat(northEastLng), Number.parseFloat(southWestLat)],
				[Number.parseFloat(northEastLng), Number.parseFloat(northEastLat)],
				[Number.parseFloat(southWestLng), Number.parseFloat(northEastLat)]
			]
		}
		const points =
			boundaries && filterInArea
				? randomPoints.filter((point) =>
						isPointInsidePolygon(boundaries, point.coordinates)
					)
				: randomPoints
		return HttpResponse.json({
			previews:
				boundaries && filterInArea
					? previews.filter((ccp) =>
							isPointInsidePolygon(boundaries, ccp.averageLocation.coordinates)
						)
					: previews,
			points: {
				content: points.map((p) => ({ count: 1, point: p })),
				total: points.length
			}
		} satisfies ClearCutsResponse)
	})

export const mockClearCutReportResponse = (
	override: Partial<ClearCutReportResponse> = {},
	options: ClearCutReportResponseMockOptions = {}
) => {
	const baseMock = createClearCutReportResponseBaseMock(override, options)
	return {
		handler: http.get(
			"*/api/v1/clear-cuts-reports/:id",
			({ params, request }) => {
				const { id } = params as { id: string }
				const authHeader = request.headers.get("Authorization")
				let affectedUser: PublicUser | undefined
				if (authHeader?.includes(volunteerAssignedToken)) {
					affectedUser = volunteerAssignedMock
				}
				return HttpResponse.json({
					...baseMock,
					id,
					affectedUser: affectedUser ?? baseMock.affectedUser
				} satisfies ClearCutReportResponse)
			}
		),
		response: baseMock
	}
}
