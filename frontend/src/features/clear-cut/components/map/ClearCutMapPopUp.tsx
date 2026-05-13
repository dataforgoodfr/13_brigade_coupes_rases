import { useMemo } from "react"
import { FormattedDate, FormattedNumber, useIntl } from "react-intl"
import { Popup, useMap } from "react-leaflet"

import { Button } from "@/components/ui/button"
import { DotByStatus } from "@/features/clear-cut/components/DotByStatus"
import { RuleBadge } from "@/features/clear-cut/components/RuleBadge"
import { useNavigateToClearCut } from "@/features/clear-cut/hooks"
import type { ClearCutReport } from "@/features/clear-cut/store/clear-cuts"
import {
	requestAssignReportThunk,
	getClearCutsThunk,
	unassignReportThunk
} from "@/features/clear-cut/store/clear-cuts-slice"
import { selectFiltersRequest } from "@/features/clear-cut/store/filters.slice"
import { useConnectedMe } from "@/features/user/store/me.slice"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"
import { useToast } from "@/hooks/use-toast"

type Props = {
	totalAreaHectare: number
	totalBdfDeciduousAreaHectare?: number
	totalBdfMixedAreaHectare?: number
	totalBdfPoplarAreaHectare?: number
	totalBdfResinousAreaHectare?: number
}

function BDFLabel({
	totalAreaHectare,
	totalBdfDeciduousAreaHectare,
	totalBdfMixedAreaHectare,
	totalBdfPoplarAreaHectare,
	totalBdfResinousAreaHectare
}: Props) {
	const { formatNumber } = useIntl()
	const types = {
		Feuillus: totalBdfDeciduousAreaHectare,
		Mélangée: totalBdfMixedAreaHectare,
		Peupleraie: totalBdfPoplarAreaHectare,
		Résineux: totalBdfResinousAreaHectare
	}

	const relevantTypes = Object.entries(types)
		.map(([label, value]) => ({
			label,
			percentage: (value || 0) / totalAreaHectare
		}))
		.filter(({ percentage }) => percentage >= 0.01)
		.sort((a, b) => b.percentage - a.percentage)

	const labelString = relevantTypes
		.map(
			({ label, percentage }) =>
				`${label} (${formatNumber(percentage, { style: "percent" })})`
		)
		.join(" / ")

	return (
		<div>
			Type de forêt : <strong>{labelString || "Non renseigné"}</strong>
		</div>
	)
}

export function ClearCutMapPopUp({
	report: {
		status,
		rules: tags,
		firstCutDate,
		lastCutDate,
		totalAreaHectare,
		updatedAt,
		slopeAreaHectare,
		clearCuts,
		city,
		name,
		totalBdfDeciduousAreaHectare,
		totalBdfMixedAreaHectare,
		totalBdfPoplarAreaHectare,
		totalBdfResinousAreaHectare,
		id,
		userId,
		assignmentRequestedById
	}
}: {
	report: ClearCutReport
}) {
	const dispatch = useAppDispatch()
	const user = useConnectedMe()
	const filters = useAppSelector(selectFiltersRequest)
	const navigateToDetail = useNavigateToClearCut(id)
	const { toast } = useToast()
	const map = useMap()

	const ecological_zonings = useMemo(() => {
		const uniqNames = new Set(
			clearCuts.flatMap((z) => z.ecologicalZonings).map((z) => z.name)
		)
		return Array.from(uniqNames).join(",")
	}, [clearCuts])

	const dispatchAndRefresh = async (thunk: any, errorMessage: string) => {
		const action = await dispatch(thunk)
		if (action.type.endsWith("/rejected")) {
			toast({ id: "popup-error", title: "Erreur", description: errorMessage })
		} else {
			map.closePopup()
			if (filters) dispatch(getClearCutsThunk(filters))
		}
	}

	const isAdmin = user?.role === "admin"
	const myId = user?.id

	const renderAssignmentSection = () => {
		if (!user) return null

		// Already assigned
		if (userId) {
			if (userId === myId || isAdmin) {
				return (
					<>
						<p className="text-xs text-green-700 font-semibold text-center">
							✓ Coupe attribuée à un bénévole
						</p>
						<Button
							type="button"
							onClick={(e) => {
								e.stopPropagation()
								dispatchAndRefresh(
									unassignReportThunk(id),
									"Impossible d'annuler l'attribution."
								)
							}}
							className="w-full text-xs h-8 cursor-pointer"
							variant="destructive"
							size="sm"
						>
							Annuler l'attribution
						</Button>
					</>
				)
			}
			return (
				<p className="text-xs text-center text-neutral-500 italic mb-1">
					Déjà attribuée à un autre bénévole
				</p>
			)
		}

		// Pending request
		if (assignmentRequestedById) {
			if (assignmentRequestedById === myId || isAdmin) {
				return (
					<p className="text-xs text-amber-600 font-medium text-center">
						⏳ Demande d'attribution en attente de validation
					</p>
				)
			}
			return (
				<p className="text-xs text-center text-neutral-500 italic mb-1">
					Demande en cours par un autre bénévole
				</p>
			)
		}

		// Free — volunteer can request, admin cannot
		if (!isAdmin) {
			return (
				<Button
					type="button"
					onClick={(e) => {
						e.stopPropagation()
						dispatchAndRefresh(
							requestAssignReportThunk(id),
							"Impossible de demander l'attribution."
						)
					}}
					className="w-full text-xs h-8 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
					size="sm"
				>
					Demander l'attribution
				</Button>
			)
		}

		return null
	}

	return (
		<Popup closeButton={false} maxWidth={350}>
			<div className="flex justify-between items-center mb-5 w-full font-inter">
				<div className="flex items-center">
					<h2 className="font-semibold text-lg">{name ?? city}</h2>
					<DotByStatus className="ml-2.5" status={status} />
				</div>
			</div>

			<div className="flex mb-5 gap-2 font-inter">
				{tags.map((tag) => (
					<RuleBadge key={tag.id} {...tag} />
				))}
			</div>

			<div className="flex flex-col gap-2.5 text-base text-secondary font-jakarta font-medium">
				<div>
					Début de la coupe :{" "}
					<strong>
						<FormattedDate value={firstCutDate} />
					</strong>
				</div>
				<div>
					Fin de la coupe :{" "}
					<strong>
						<FormattedDate value={lastCutDate} />
					</strong>
				</div>
				<div>
					Date du signalement :{" "}
					<strong>
						<FormattedDate value={updatedAt} />
					</strong>
				</div>
				<div>
					Taille de la coupe :
					<strong>
						{" "}
						<FormattedNumber value={totalAreaHectare} /> HA
					</strong>
				</div>
				{slopeAreaHectare && (
					<div>
						{"Pente raide (>30%) :"}
						<strong>
							{" "}
							<FormattedNumber
								value={slopeAreaHectare}
								maximumFractionDigits={2}
							/>{" "}
							ha
						</strong>
					</div>
				)}
				{ecological_zonings && (
					<div>
						Zones Natura :<strong>{ecological_zonings}</strong>
					</div>
				)}
				<BDFLabel
					totalAreaHectare={totalAreaHectare}
					totalBdfDeciduousAreaHectare={totalBdfDeciduousAreaHectare}
					totalBdfMixedAreaHectare={totalBdfMixedAreaHectare}
					totalBdfPoplarAreaHectare={totalBdfPoplarAreaHectare}
					totalBdfResinousAreaHectare={totalBdfResinousAreaHectare}
				/>
			</div>

			<div className="flex flex-col gap-2 mt-4 pt-3 border-t border-neutral-100">
				{renderAssignmentSection()}
				<Button
					type="button"
					onClick={(e) => {
						e.stopPropagation()
						navigateToDetail()
					}}
					className="w-full text-xs h-8 cursor-pointer"
					variant="outline"
				>
					Renseigner les informations
				</Button>
			</div>
		</Popup>
	)
}
