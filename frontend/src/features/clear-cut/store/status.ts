import type { ClearCutStatus } from "@/features/clear-cut/store/clear-cuts";

export const CLEAR_CUTTING_STATUS_COLORS = {
	to_validate: "red-500",
	waiting_for_validation: "orange-400",
	legal_validated: "orange-500",
	validated: "green-500",
	final_validated: "lime-500",
} as const;
export const CLEAR_CUTTING_STATUS_BACKGROUND_COLORS = {
	to_validate: "bg-red-500",
	waiting_for_validation: "bg-orange-400",
	legal_validated: "bg-orange-500",
	validated: "bg-green-500",
	final_validated: "bg-lime-500",
} as const;

export type StatusColor = (typeof CLEAR_CUTTING_STATUS_COLORS)[ClearCutStatus];

export const CLEAR_CUTTING_STATUS_TRANSLATIONS: Record<ClearCutStatus, string> =
	{
		to_validate: "À vérifier",
		waiting_for_validation: "En attente de validation terrain",
		validated: "Validé",
		legal_validated: "Validé avec poursuites",
		final_validated: "Validé sans poursuites",
	};
