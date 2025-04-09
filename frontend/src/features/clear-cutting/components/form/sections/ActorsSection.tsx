import type { ClearCutForm } from "@/features/clear-cutting/store/clear-cuttings";
import { FormItemType, type SectionForm, type SectionFormItem } from "../types";

export const actorsKey: SectionForm = {
	name: "Acteurs engagés",
	className: "flex flex-col gap-4",
};

export const actorsValue: SectionFormItem<ClearCutForm>[] = [
	{
		name: "companyName",
		label: "Nom de l'entreprise qui réalise les travaux",
		type: FormItemType.InputText,
		renderConditions: [],
	},
	{
		name: "subcontractor",
		label: "Nom du sous-traitant (si pertinant)",
		type: FormItemType.InputText,
		renderConditions: [],
	},
	{
		name: "ownerName",
		label: "Nom du propriétaire",
		type: FormItemType.InputText,
		renderConditions: [],
	},
];
