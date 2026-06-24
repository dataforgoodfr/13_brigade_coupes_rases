import { useNavigate } from "@tanstack/react-router"
import L from "leaflet"
import { X } from "lucide-react"
import { useMemo, useRef } from "react"
import { FormattedDate, FormattedNumber, useIntl } from "react-intl"
import { Popup, useMap } from "react-leaflet"

import { Button } from "@/components/ui/button"
import { DotByStatus } from "@/features/clear-cut/components/DotByStatus"
import { RuleBadge } from "@/features/clear-cut/components/RuleBadge"
import type { ClearCutReport } from "@/features/clear-cut/store/clear-cuts"
import {
	getClearCutsThunk,
	requestAssignReportThunk,
	unassignReportThunk
} from "@/features/clear-cut/store/clear-cuts-slice"
import { selectFiltersRequest } from "@/features/clear-cut/store/filters.slice"
import { useConnectedMe } from "@/features/user/store/me.slice"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"

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
	},
	isReportPanelOpen = false
}: {
	report: ClearCutReport
	isReportPanelOpen?: boolean
}) {
	const dispatch = useAppDispatch()
	const user = useConnectedMe()
	const filters = useAppSelector(selectFiltersRequest)
	const { toast } = useToast()
	const map = useMap()
	const navigate = useNavigate()
	const popupRef = useRef<L.Popup>(null)

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
								e.nativeEvent.stopImmediatePropagation()
								dispatchAndRefresh(
									unassignReportThunk(id),
									"Impossible d'annuler l'attribution."
								)
							}}
							className="w-full text-xs min-h-[44px] cursor-pointer"
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
						e.nativeEvent.stopImmediatePropagation()
						dispatchAndRefresh(
							requestAssignReportThunk(id),
							"Impossible de demander l'attribution."
						)
					}}
					className="w-full text-xs min-h-[44px] cursor-pointer"
					size="sm"
				>
					Demander l'attribution
				</Button>
			)
		}

		return null
	}

	const disablePopupPropagation = () => {
		const el = popupRef.current?.getElement()
		if (el) {
			L.DomEvent.disableClickPropagation(el)
			L.DomEvent.disableScrollPropagation(el)
		}
	}

	return (
		<Popup
			ref={popupRef}
			closeButton={false}
			maxWidth={280}
			autoPan={false}
			eventHandlers={{ add: disablePopupPropagation }}
		>
			<div className="flex justify-between items-center gap-2 mb-3 w-full font-inter">
				<div className="flex items-center">
					<h2 className="font-semibold text-base">{name ?? city}</h2>
					<DotByStatus className="ml-2.5" status={status} />
				</div>
				<button
					type="button"
					aria-label="Fermer"
					onClick={(e) => {
						e.stopPropagation()
						e.nativeEvent.stopImmediatePropagation()
						map.closePopup()
					}}
					className="flex shrink-0 items-center justify-center -mr-2 -mt-2 h-11 w-11 rounded-full text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200 cursor-pointer touch-manipulation transition-colors"
				>
					<X className="h-5 w-5" strokeWidth={2.5} />
				</button>
			</div>

			<div className="flex mb-3 gap-2 font-inter">
				{tags.map((tag) => (
					<RuleBadge key={tag.id} {...tag} />
				))}
			</div>

			<div className="flex flex-col gap-2 text-sm text-secondary font-jakarta font-medium">
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

			<div className="flex flex-col gap-2 mt-3 pt-3 border-t border-neutral-100">
				{renderAssignmentSection()}
				{/* Hidden when the side info panel is already open for this report:
				    the button would just re-open the panel it is already showing. */}
				{!isReportPanelOpen && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={(e) => {
							e.stopPropagation()
							e.nativeEvent.stopImmediatePropagation()
							navigate({
								to: "/clear-cuts/$clearCutId",
								params: { clearCutId: id }
							})
						}}
						className="w-full text-xs min-h-[44px] cursor-pointer"
					>
						Renseigner les informations
					</Button>
				)}
			</div>
		</Popup>
	)
}
