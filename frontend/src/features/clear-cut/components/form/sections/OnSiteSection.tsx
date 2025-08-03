import type { ClearCutForm } from "@/features/clear-cut/store/clear-cuts";
import type { FixedItem, SectionForm, SectionFormItem } from "../types";

export const onSiteKey: SectionForm = {
	name: "Terrain",
	className: "flex flex-col gap-4",
};

export const onSiteValue: SectionFormItem<ClearCutForm>[] = [
	{
		name: "report.affectedUser",
		label: "Bénévole en charge du terrain :",
		type: "fixed",
		renderConditions: ["report.affectedUser"],
		fallBack: (key: string | number) => (
			<div key={key} className="flex gap-2 my-2">
				<p className="font-bold">Bénévole en charge du terrain : </p>
				<p>Aucun bénévole n'est assigné</p>
			</div>
		),
	} satisfies FixedItem<ClearCutForm, "report.affectedUser">,
	{
		name: "inspectionDate",
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
		name: "forest",
		label: "Type de peuplement avant la coupe",
		type: "textArea",
		renderConditions: [],
	},
	{
		name: "hasRemainingTrees",
		label: "Présence plantation après la coupe ?",
		type: "switch",
		renderConditions: [],
	},
	{
		name: "treesSpecies",
		label: "Essence plantée (si pertinant)",
		type: "textArea",
		renderConditions: [],
	},
	{
		name: "plantingImages",
		label: "Photo de la plantation (si pertinant)",
		type: "inputFile",
		renderConditions: [],
	},
	{
		name: "hasConstructionPanel",
		label: "Le panneau de chantier est-il visible ?",
		type: "switch",
		renderConditions: [],
	},
	{
		name: "constructionPanelImages",
		label: "Photo du panneau",
		type: "inputFile",
		renderConditions: ["hasConstructionPanel"],
	},
	{
		name: "wetland",
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
		name: "destructionClues",
		label:
			"Indices de destruction d’espèces protégées ou d’habitats d’espèces protégées",
		type: "textArea",
		renderConditions: [],
	},
	{
		name: "clearCutImages",
		label: "Photos de la coupe",
		type: "inputFile",
		renderConditions: [],
	},
	{
		name: "treeTrunksImages",
		label: "Photos des bois coupés (sur la parcelle ou bord de route)",
		type: "inputFile",
		renderConditions: [],
	},
	{
		name: "soilStateImages",
		label: "Photos permettant de constater l'état des sols",
		type: "inputFile",
		renderConditions: [],
	},
	{
		name: "accessRoadImages",
		label: "Photos des chemins d'accès",
		type: "inputFile",
		renderConditions: [],
	},
];
