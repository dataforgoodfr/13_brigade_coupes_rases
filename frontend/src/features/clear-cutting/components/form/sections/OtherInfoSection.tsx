import { ClearCuttingForm } from "@/features/clear-cutting/store/clear-cuttings";
import { FormItemType, SectionForm, SectionFormItem } from "../types";

export const otherInfoKey : SectionForm  = { 
    name: "Autres informations", 
    className: "flex flex-col gap-4" }

export const otherInfoValue : SectionFormItem<ClearCuttingForm>[] = [
    {
        name: "otherInfos",
        label: "Informations complémentaires",
        type: FormItemType.TextArea,
        renderConditions: [],
    }
]