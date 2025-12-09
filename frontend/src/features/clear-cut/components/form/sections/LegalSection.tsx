import type { ClearCutFormInput } from "@/features/clear-cut/store/clear-cuts"

import type { SectionForm, SectionFormItem } from "../types"

export const legalKey: SectionForm = {
	name: "Stratégie juridique",
	className: "flex flex-col gap-4"
} as const

export const legalValue: SectionFormItem<ClearCutFormInput>[] = [
	{
		name: "relevantForPefcComplaint",
		label: "Pertinent pour plainte PEFC",
		type: "switch",
		renderConditions: []
	},
	{
		name: "relevantForRediiiComplaint",
		label: "Pertinent pour plainte REDIII",
		type: "switch",
		renderConditions: []
	},
	{
		name: "relevantForOfbComplaint",
		label: "Pertinent pour plainte OFB",
		type: "switch",
		renderConditions: []
	},
	{
		name: "relevantForAlertCnpfDdtSrgs",
		label: "Pertinent pour alerte CNPF/DDT pour non-respect des SRGS",
		type: "switch",
		renderConditions: []
	},
	{
		name: "relevantForAlertCnpfDdtPsgThresholds",
		label: "Pertinent pour alerte CNPF/DDT pour non-respect des seuils PSG",
		type: "switch",
		renderConditions: []
	},
	{
		name: "relevantForPsgRequest",
		label: "Pertinent pour demande de PSG",
		type: "switch",
		renderConditions: []
	},
	{
		name: "requestEngaged",
		label: "Démarches engagées",
		type: "textArea",
		renderConditions: []
	}
]
