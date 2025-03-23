import type { ClearCuttingStatus } from "@/shared/store/referential/referential";

export const CLEAR_CUTTING_STATUS_COLORS = {
	toValidate: "red-500",
	waitingForValidation: "orange-400",
	legalValidated: "orange-500",
	validated: "green-500",
	finalValidated: "lime-500",
} as const;
export const CLEAR_CUTTING_STATUS_BACKGROUND_COLORS = {
	toValidate: "bg-red-500",
	waitingForValidation: "bg-orange-400",
	legalValidated: "bg-orange-500",
	validated: "bg-green-500",
	finalValidated: "bg-lime-500",
} as const;

export type StatusColor =
	(typeof CLEAR_CUTTING_STATUS_COLORS)[ClearCuttingStatus];

export const CLEAR_CUTTING_STATUS_TRANSLATIONS: Record<
	ClearCuttingStatus,
	string
> = {
	toValidate: "À vérifier",
	waitingForValidation: "En attente de validation terrain",
	validated: "Validé",
	legalValidated: "Validé avec poursuites",
	finalValidated: "Validé sans poursuites",
};
