import type { ClearCutForm } from "@/features/clear-cut/store/clear-cuts";
import type { SectionForm, SectionFormItem } from "../types";

export const regulationsKey: SectionForm = {
	name: "Réglementations",
	className: "flex flex-col gap-4",
};

export const regulationsValue: SectionFormItem<ClearCutForm>[] = [
	{
		name: "isPefcFscCertified",
		label: "Coupe ou entreprise certifiée PEFC/FSC ?",
		type: "toggleGroup",
		renderConditions: [],
	},
	{
		name: "isOver20Ha",
		label: "Propriété de plus de 20 hectares",
		type: "toggleGroup",
		renderConditions: [],
	},
	{
		name: "isPsgRequiredPlot",
		label: "Parcelle soumise à PSG",
		type: "toggleGroup",
		renderConditions: [],
	},
];
