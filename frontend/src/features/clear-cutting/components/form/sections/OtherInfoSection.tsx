import type { ClearCutForm } from "@/features/clear-cutting/store/clear-cuttings";
import { FormItemType, type SectionForm, type SectionFormItem } from "../types";

export const otherInfoKey: SectionForm = {
	name: "Autres informations",
	className: "flex flex-col gap-4",
};

export const otherInfoValue: SectionFormItem<ClearCutForm>[] = [
	{
		name: "otherInfos",
		label: "Informations complémentaires",
		type: FormItemType.TextArea,
		renderConditions: [],
	},
];
