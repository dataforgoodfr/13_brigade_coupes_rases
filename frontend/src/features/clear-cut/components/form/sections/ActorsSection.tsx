import type { ClearCutForm } from "@/features/clear-cut/store/clear-cuts";
import type { SectionForm, SectionFormItem } from "../types";

export const actorsKey: SectionForm = {
	name: "Acteurs engagés",
	className: "flex flex-col gap-4",
};

export const actorsValue: SectionFormItem<ClearCutForm>[] = [
	{
		name: "companyName",
		label: "Nom de l'entreprise qui réalise les travaux",
		type: "inputText",
		renderConditions: [],
	},
	{
		name: "subcontractor",
		label: "Nom du sous-traitant (si pertinant)",
		type: "inputText",
		renderConditions: [],
	},
	{
		name: "ownerName",
		label: "Nom du propriétaire",
		type: "inputText",
		renderConditions: [],
	},
];
