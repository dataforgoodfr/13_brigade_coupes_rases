import { faker } from "@faker-js/faker"
import { HttpResponse, http } from "msw"

import type {
	DepartmentResponse,
	EcologicalZoningResponse,
	ReferentialResponse,
	RuleResponse
} from "@/shared/store/referential/referential"

export const fakeRules: RuleResponse = {
	[faker.string.uuid()]: {
		type: "ecological_zoning",
		ecologicalZoningsIds: []
	},
	[faker.string.uuid()]: {
		type: "area",
		threshold: faker.number.int({ min: 0, max: 100 })
	},
	[faker.string.uuid()]: {
		type: "slope",
		threshold: faker.number.int({ min: 0, max: 100 })
	}
}

export const fakeEcologicalZonings: EcologicalZoningResponse = {
	"1": {
		type: "Natura2000",
		subType: "ZSC",
		name: "Forêt de Rambouillet",
		code: "FR1100796"
	},
	"2": {
		type: "Natura2000",
		name: "Etands de canal d'Ille et Rance",
		code: "FR5300050"
	}
}
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
	"Mayotte"
].reduce<DepartmentResponse>((acc, department) => {
	acc[faker.string.uuid()] = { name: department }
	return acc
}, {})

export const mockReferential = http.get("*/api/v1/referential", () => {
	return HttpResponse.json({
		departments: fakeDepartments,
		ecologicalZonings: fakeEcologicalZonings,
		rules: fakeRules
	} satisfies ReferentialResponse)
})
