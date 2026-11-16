import { History } from "lucide-react"
import { useEffect, useState } from "react"
import { FormattedDate, FormattedNumber } from "react-intl"

import { Button } from "@/components/ui/button"
import { useMapInstance } from "@/features/clear-cut/components/map/Map.context"
import type { BoundaryHistoryEntry } from "@/features/clear-cut/store/clear-cuts"
import { getBoundaryHistoryThunk } from "@/features/clear-cut/store/clear-cuts-slice"
import { useAppDispatch } from "@/shared/hooks/store"

type HistoryState =
	| { status: "idle" | "pending" | "error" }
	| { status: "success"; entries: BoundaryHistoryEntry[] }

/**
 * Perimeters of a clear cut replaced by manual corrections, for admins. Each
 * one can be drawn over the map, dashed, next to the current perimeter.
 */
export function BoundaryHistory({
	clearCutId,
	label
}: {
	clearCutId: string
	label?: string
}) {
	const dispatch = useAppDispatch()
	const { previousBoundary, setPreviousBoundary } = useMapInstance()
	const [history, setHistory] = useState<HistoryState>({ status: "idle" })

	// Remove the drawn perimeter when the history is closed
	useEffect(
		() => () => {
			setPreviousBoundary(undefined)
		},
		[setPreviousBoundary]
	)

	const load = async () => {
		setHistory({ status: "pending" })
		try {
			const entries = await dispatch(
				getBoundaryHistoryThunk({ clearCutId })
			).unwrap()
			setHistory({ status: "success", entries })
		} catch {
			setHistory({ status: "error" })
		}
	}

	if (history.status !== "success") {
		return (
			<div className="flex flex-col gap-1">
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-fit"
					disabled={history.status === "pending"}
					onClick={load}
				>
					<History size={14} className="mr-1" />
					Historique du contour{label ? ` (${label})` : ""}
				</Button>
				{history.status === "error" && (
					<p className="text-xs text-red-600">
						Impossible de charger l'historique.
					</p>
				)}
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-1 text-sm">
			<p className="font-medium">
				Contours remplacés{label ? ` (${label})` : ""}
			</p>
			{history.entries.length === 0 && (
				<p className="text-xs text-neutral-600">Aucun contour remplacé.</p>
			)}
			<ul className="flex flex-col gap-1">
				{history.entries.map((entry, index) => {
					const key = `${clearCutId}-${entry.editedAt}-${index}`
					const shown = previousBoundary?.key === key
					return (
						<li key={key} className="flex flex-wrap items-center gap-2">
							<span>
								Remplacé le <FormattedDate value={entry.editedAt} />
								{entry.editedBy ? ` par ${entry.editedBy}` : ""} —{" "}
								<FormattedNumber
									value={entry.previousAreaHectare}
									maximumFractionDigits={1}
								/>{" "}
								ha
							</span>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() =>
									setPreviousBoundary(
										shown
											? undefined
											: { key, boundary: entry.previousBoundary }
									)
								}
							>
								{shown ? "Masquer sur la carte" : "Voir sur la carte"}
							</Button>
						</li>
					)
				})}
			</ul>
		</div>
	)
}
