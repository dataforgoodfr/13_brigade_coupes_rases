import { z } from "zod";

export const CLEAR_CUTTING_STATUS_COLORS = {
	toValidate: "red-500",
	legalValidated: "orange-500",
	validated: "green-500",
	finalValidated: "lime-500",
} as const;
export const CLEAR_CUTTING_STATUS_BACKGROUND_COLORS = {
	toValidate: "bg-red-500",
	legalValidated: "bg-orange-500",
	validated: "bg-green-500",
	finalValidated: "bg-lime-500",
} as const;

export type StatusColor =
	(typeof CLEAR_CUTTING_STATUS_COLORS)[ClearCuttingStatus];
export const CLEAR_CUTTING_STATUSES = [
	"toValidate",
	"validated",
	"legalValidated",
	"finalValidated",
] as const;

export const CLEAR_CUTTING_STATUS_TRANSLATIONS: Record<
	ClearCuttingStatus,
	string
> = {
	toValidate: "À vérifier",
	validated: "Validé",
	legalValidated: "Validé avec poursuites",
	finalValidated: "Validé sans poursuites",
};

export const clearCuttingStatusSchema = z.enum(CLEAR_CUTTING_STATUSES);
export type ClearCuttingStatus = z.infer<typeof clearCuttingStatusSchema>;
