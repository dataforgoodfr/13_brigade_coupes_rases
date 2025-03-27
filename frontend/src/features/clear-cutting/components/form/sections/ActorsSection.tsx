import { ClearCuttingForm } from "@/features/clear-cutting/store/clear-cuttings";
import { FormItemType, SectionForm, SectionFormItem } from "../types";

export const actorsKey : SectionForm = { 
    name: "Acteurs engagés", 
    className: "flex flex-col gap-4" 
};

export const actorsValue :  SectionFormItem<ClearCuttingForm>[] = [
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