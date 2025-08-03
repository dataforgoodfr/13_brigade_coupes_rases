import type { ClearCutForm } from "@/features/clear-cut/store/clear-cuts";
import type { SectionForm, SectionFormItem } from "../types";

export const otherInfoKey: SectionForm = {
	name: "Autres informations",
	className: "flex flex-col gap-4",
};

export const otherInfoValue: SectionFormItem<ClearCutForm>[] = [
	{
		name: "other",
		label: "Informations complémentaires",
		type: "textArea",
		renderConditions: [],
	},
];
