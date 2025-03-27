import { ClearCuttingForm } from "@/features/clear-cutting/store/clear-cuttings";
import { FormItemType, SectionForm, SectionFormItem } from "../types";

export const generalInfoKey : SectionForm  = { 
    name: "Informations générales", 
    className: "grid grid-cols-2 gap-2" 
}

export const generalInfoValue : SectionFormItem<ClearCuttingForm>[] = [
    {
        name: "reportDate",
        transformValue: (val: unknown) =>
            new Date(val as string).toLocaleDateString(),
        label: "Date de signalement",
        type: FormItemType.Fixed,
        renderConditions: [],
    },
    {
        name: "address.city",
        label: "Commune",
        type: FormItemType.Fixed,
        renderConditions: [],
    },
    {
        name: "address.postalCode",
        label: "Département",
        type: FormItemType.Fixed,
        renderConditions: [],
    },
    {
        name: "center.0",
        label: "Latitude",
        type: FormItemType.Fixed,
        renderConditions: [],
    },
    {
        name: "center.1",
        label: "Longitude",
        type: FormItemType.Fixed,
        renderConditions: [],
    },
    {
        name: "cadastralParcel.id",
        label: "Parcelle cadastrale",
        type: FormItemType.Fixed,
        renderConditions: [],
    },
    {
        name: "cutYear",
        label: "Date de la coupe",
        type: FormItemType.Fixed,
        renderConditions: [],
    },
    {
        name: "clearCuttingSize",
        label: "Taille de la coupe",
        type: FormItemType.Fixed,
        renderConditions: [],
        transformValue: (val: unknown) => `${val} ha`
    },
    {
        name: "clearCuttingSlope",
        label: "Pourcentage de pente",
        type: FormItemType.Fixed,
        renderConditions: [],
        transformValue: (val: unknown) => `${val}%`
    },
]