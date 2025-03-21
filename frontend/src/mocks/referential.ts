import { range } from "@/shared/array";
import type {
	ClearCuttingStatus,
	DepartmentResponse,
	EcologicalZoningResponse,
	ReferentialResponse,
	StatusResponse,
	TagResponse,
} from "@/shared/store/referential/referential";
import { faker } from "@faker-js/faker";
import { http, HttpResponse } from "msw";

export const fakeTags: TagResponse = {
	[faker.string.uuid()]: { type: "ecologicalZoning" },
	[faker.string.uuid()]: {
		type: "excessiveArea",
		value: faker.number.int({ min: 0, max: 100 }),
	},
	[faker.string.uuid()]: {
		type: "excessiveSlop",
		value: faker.number.int({ min: 0, max: 100 }),
	},
};

export const fakeEcologicalZoning: EcologicalZoningResponse =
	Object.fromEntries(
		range(5, () => [
			faker.string.uuid(),
			{ name: faker.company.buzzAdjective() },
		]),
	);
export const fakeDepartments: DepartmentResponse = [
	"Ain",
	"Aisne",
	"Allier",
	"Alpes-de-Haute-Provence",
	"Hautes-Alpes",
	"Alpes-Maritimes",
	"Ardèche",
	"Ardennes",
	"Ariège",
	"Aube",
	"Aude",
	"Aveyron",
	"Bouches-du-Rhône",
	"Calvados",
	"Cantal",
	"Charente",
	"Charente-Maritime",
	"Cher",
	"Corrèze",
	"Côte-d'Or",
	"Côtes-d'Armor",
	"Creuse",
	"Dordogne",
	"Doubs",
	"Drôme",
	"Eure",
	"Eure-et-Loir",
	"Finistère",
	"Corse-du-Sud",
	"Haute-Corse",
	"Gard",
	"Haute-Garonne",
	"Gers",
	"Gironde",
	"Hérault",
	"Ille-et-Vilaine",
	"Indre",
	"Indre-et-Loire",
	"Isère",
	"Jura",
	"Landes",
	"Loir-et-Cher",
	"Loire",
	"Haute-Loire",
	"Loire-Atlantique",
	"Loiret",
	"Lot",
	"Lot-et-Garonne",
	"Lozère",
	"Maine-et-Loire",
	"Manche",
	"Marne",
	"Haute-Marne",
	"Mayenne",
	"Meurthe-et-Moselle",
	"Meuse",
	"Morbihan",
	"Moselle",
	"Nièvre",
	"Nord",
	"Oise",
	"Orne",
	"Pas-de-Calais",
	"Puy-de-Dôme",
	"Pyrénées-Atlantiques",
	"Hautes-Pyrénées",
	"Pyrénées-Orientales",
	"Bas-Rhin",
	"Haut-Rhin",
	"Rhône",
	"Haute-Saône",
	"Saône-et-Loire",
	"Sarthe",
	"Savoie",
	"Haute-Savoie",
	"Paris",
	"Seine-Maritime",
	"Seine-et-Marne",
	"Yvelines",
	"Deux-Sèvres",
	"Somme",
	"Tarn",
	"Tarn-et-Garonne",
	"Var",
	"Vaucluse",
	"Vendée",
	"Vienne",
	"Haute-Vienne",
	"Vosges",
	"Yonne",
	"Territoire de Belfort",
	"Essonne",
	"Hauts-de-Seine",
	"Seine-Saint-Denis",
	"Val-de-Marne",
	"Val-d'Oise",
	"Guadeloupe",
	"Martinique",
	"Guyane",
	"La Réunion",
	"Mayotte",
].reduce<DepartmentResponse>((acc, department) => {
	acc[faker.string.uuid()] = { name: department };
	return acc;
}, {});

export const fakeStatuses = (
	[
		"finalValidated",
		"legalValidated",
		"toValidate",
		"waitingForValidation",
		"validated",
	] as ClearCuttingStatus[]
).reduce<StatusResponse>((acc, status) => {
	acc[faker.string.uuid()] = { name: status };
	return acc;
}, {});
export const mockReferential = http.get("*/referential", () => {
	return HttpResponse.json({
		departments: fakeDepartments,
		ecologicalZoning: fakeEcologicalZoning,
		tags: fakeTags,
		statuses: fakeStatuses,
	} satisfies ReferentialResponse);
});
