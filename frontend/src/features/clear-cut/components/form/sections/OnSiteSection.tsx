import type { ClearCutForm } from "@/features/clear-cut/store/clear-cuts";
import type { SectionForm, SectionFormItem } from "../types";

export const onSiteKey: SectionForm = {
	name: "Terrain",
	className: "flex flex-col gap-4",
};

export const onSiteValue: SectionFormItem<ClearCutForm>[] = [
	{
		name: "assignedUser",
		label: "Bénévole en charge du terrain :",
		type: "fixed",
		renderConditions: ["assignedUser"],
		fallBack: (key: string | number) => (
			<div key={key} className="flex gap-2 my-2">
				<p className="font-bold">Bénévole en charge du terrain : </p>
				<p>Aucun bénévole n'est assigné</p>
			</div>
		),
	},
	{
		name: "onSiteDate",
		label: "Date du terrain",
		type: "datePicker",
		renderConditions: [],
	},
	{
		name: "weather",
		label: "Météo",
		type: "textArea",
		renderConditions: [],
	},
	{
		name: "standTypeAndSilviculturalSystemBCC",
		label: "Type de peuplement avant la coupe",
		type: "textArea",
		renderConditions: [],
	},
	{
		name: "isPlantationPresentACC",
		label: "Présence plantation après la coupe ?",
		type: "switch",
		renderConditions: [],
	},
	{
		name: "newTreeSpicies",
		label: "Essence plantée (si pertinant)",
		type: "textArea",
		renderConditions: ["isPlantationPresentACC"],
	},
	{
		name: "imgsPlantation",
		label: "Photo de la plantation (si pertinant)",
		type: "inputFile",
		renderConditions: ["isPlantationPresentACC"],
	},
	{
		name: "isWorksiteSignPresent",
		label: "Le panneau de chantier est-il visible ?",
		type: "switch",
		renderConditions: [],
	},
	{
		name: "imgWorksiteSign",
		label: "Photo du panneau",
		type: "inputFile",
		renderConditions: ["isWorksiteSignPresent"],
	},
	{
		name: "waterCourseOrWetlandPresence",
		label:
			"Traversées de cours d'eau ou présence d'habitats d'espèces protégées",
		type: "textArea",
		renderConditions: [],
	},
	{
		name: "soilState",
		label: "Description de l'état des sols",
		type: "textArea",
		renderConditions: [],
	},
	{
		name: "imgsClearCut",
		label: "Photos de la coupe",
		type: "inputFile",
		renderConditions: [],
	},
	{
		name: "imgsTreeTrunks",
		label: "Photos des bois coupés (sur la parcelle ou bord de route)",
		type: "inputFile",
		renderConditions: [],
	},
	{
		name: "imgsSoilState",
		label: "Photos permettant de constater l'état des sols",
		type: "inputFile",
		renderConditions: [],
	},
	{
		name: "imgsAccessRoad",
		label: "Photos des chemins d'accès",
		type: "inputFile",
		renderConditions: [],
	},
];
