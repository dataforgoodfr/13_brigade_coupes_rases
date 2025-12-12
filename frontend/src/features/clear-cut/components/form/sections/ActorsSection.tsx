import type { ClearCutFormInput } from "@/features/clear-cut/store/clear-cuts"

import type { SectionForm, SectionFormItem } from "../types"

export const actorsKey: SectionForm = {
	name: "Acteurs engagés",
	className: "flex flex-col gap-4"
}

export const actorsValue: SectionFormItem<ClearCutFormInput>[] = [
	{
		name: "company",
		label: "Nom de l'entreprise qui réalise les travaux",
		type: "inputText",
		renderConditions: []
	},
	{
		name: "subcontractor",
		label: "Nom du sous-traitant (si pertinent)",
		type: "inputText",
		renderConditions: []
	},
	{
		name: "landlord",
		label: "Nom du propriétaire",
		type: "inputText",
		renderConditions: []
	}
]
