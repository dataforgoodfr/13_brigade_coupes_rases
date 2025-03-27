import { ClearCuttingForm } from "@/features/clear-cutting/store/clear-cuttings";
import { FormItemType, SectionForm, SectionFormItem } from "../types";

export const regulationsKey : SectionForm  = { 
    name: "Réglementations", 
    className: "flex flex-col gap-4" 
};

export const regulationsValue : SectionFormItem<ClearCuttingForm>[] = [
    {
        name: "isCCOrCompanyCertified",
        label: "Coupe ou entreprise certifiée PEFC/FSC ?",
        type: FormItemType.ToggleGroup,
        renderConditions: [],
    },
    {
        name: "isMoreThan20ha",
        label: "Propriété de plus de 20 hectares",
        type: FormItemType.ToggleGroup,
        renderConditions: [],
    },
    {
        name: "isSubjectToPSG",
        label: "Parcelle soumise à PSG",
        type: FormItemType.ToggleGroup,
        renderConditions: [],
    },
];