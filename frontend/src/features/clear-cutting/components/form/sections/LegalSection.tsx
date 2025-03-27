import { ClearCuttingForm } from "@/features/clear-cutting/store/clear-cuttings";
import { FormItemType, SectionForm, SectionFormItem } from "../types";

export const legalKey : SectionForm  = { 
    name: "Stratégie juridique", 
    className: "flex flex-col gap-4" 
};

export const legalValue : SectionFormItem<ClearCuttingForm>[] = [
    {
        name: "isRelevantComplaintPEFC",
        label: "Pertinent pour plainte PEFC",
        type: FormItemType.Switch,
        renderConditions: [],
    },
    {
        name: "isRelevantComplaintREDIII",
        label: "Pertinent pour plainte REDIII",
        type: FormItemType.Switch,
        renderConditions: [],
    },
    {
        name: "isRelevantComplaintOFB",
        label: "Pertinent pour plainte OFB",
        type: FormItemType.Switch,
        renderConditions: [],
    },
    {
        name: "isRelevantAlertSRGS",
        label: "Pertinent pour alerte CNPF/DDT pour non-respect des SRGS",
        type: FormItemType.Switch,
        renderConditions: [],
    },
    {
        name: "isRelevantAlertPSG",
        label: "Pertinent pour alerte CNPF/DDT pour non-respect des seuils PSG",
        type: FormItemType.Switch,
        renderConditions: [],
    },
    {
        name: "isRelevantRequestPSG",
        label: "Pertinent pour demande de PSG",
        type: FormItemType.Switch,
        renderConditions: [],
    },
    {
        name: "actionsUndertaken",
        label: "Démarches engagées",
        type: FormItemType.TextArea,
        renderConditions: [],
    },
];