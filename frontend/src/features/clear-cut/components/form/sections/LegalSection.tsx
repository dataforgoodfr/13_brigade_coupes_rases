import type { ClearCutForm } from "@/features/clear-cut/store/clear-cuts";
import type { SectionForm, SectionFormItem } from "../types";

export const legalKey: SectionForm = {
	name: "Stratégie juridique",
	className: "flex flex-col gap-4",
};

export const legalValue: SectionFormItem<ClearCutForm>[] = [
	{
		name: "isRelevantComplaintPEFC",
		label: "Pertinent pour plainte PEFC",
		type: "switch",
		renderConditions: [],
	},
	{
		name: "isRelevantComplaintREDIII",
		label: "Pertinent pour plainte REDIII",
		type: "switch",
		renderConditions: [],
	},
	{
		name: "isRelevantComplaintOFB",
		label: "Pertinent pour plainte OFB",
		type: "switch",
		renderConditions: [],
	},
	{
		name: "isRelevantAlertSRGS",
		label: "Pertinent pour alerte CNPF/DDT pour non-respect des SRGS",
		type: "switch",
		renderConditions: [],
	},
	{
		name: "isRelevantAlertPSG",
		label: "Pertinent pour alerte CNPF/DDT pour non-respect des seuils PSG",
		type: "switch",
		renderConditions: [],
	},
	{
		name: "isRelevantRequestPSG",
		label: "Pertinent pour demande de PSG",
		type: "switch",
		renderConditions: [],
	},
	{
		name: "actionsUndertaken",
		label: "Démarches engagées",
		type: "textArea",
		renderConditions: [],
	},
];
