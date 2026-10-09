import { CloudOff } from "lucide-react"

import {
	type PendingFormReason,
	usePendingForms
} from "@/features/clear-cut/store/pendingForms"

const LABELS: Record<PendingFormReason, { label: string; title: string }> = {
	offline: {
		label: "Non envoyée",
		title:
			"Saisie gardée sur cet appareil, envoyée automatiquement au retour du réseau."
	},
	photos: {
		label: "Photos à envoyer",
		title:
			"Formulaire envoyé. Des photos sont encore sur cet appareil : ouvrez la fiche avec du réseau pour les envoyer."
	},
	conflict: {
		label: "À vérifier",
		title:
			"Une version plus récente a été enregistrée entre-temps : ouvrez la fiche pour choisir."
	}
}

/** Shown on a report whose form has not fully reached the server. */
export function PendingFormBadge({ reportId }: { reportId: string }) {
	const reason = usePendingForms()[reportId]
	if (!reason) return null
	const { label, title } = LABELS[reason]
	return (
		<span
			title={title}
			className="inline-flex items-center gap-1 self-start rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900"
		>
			<CloudOff className="size-3.5 shrink-0" />
			{label}
		</span>
	)
}

/** The same reasons, spelled out in the report itself. */
export function PendingFormNotice({ reportId }: { reportId: string }) {
	const reason = usePendingForms()[reportId]
	if (!reason) return null
	return (
		<p className="text-sm text-amber-700 font-medium text-center py-1">
			{LABELS[reason].title}
		</p>
	)
}
