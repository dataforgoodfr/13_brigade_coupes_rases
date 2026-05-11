import { FormattedNumber } from "react-intl"

import type {
	ClearCutFormInput,
	ClearCutStatus
} from "@/features/clear-cut/store/clear-cuts"
import type { FormType } from "@/shared/form/types"
import type { Rule } from "@/shared/store/referential/referential"

import { RuleBadge } from "../RuleBadge"
import { StatusWithLabel } from "../StatusWithLabel"

import {
	approveAssignmentThunk,
	cancelAssignRequestThunk,
	getClearCutsThunk,
	rejectAssignmentThunk,
	requestAssignReportThunk,
	unassignReportThunk,
	updateReportStatusThunk
} from "@/features/clear-cut/store/clear-cuts-slice"
import { selectFiltersRequest } from "@/features/clear-cut/store/filters.slice"
import { useConnectedMe } from "@/features/user/store/me.slice"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"
import { Button } from "@/components/ui/button"

export function AccordionHeader({
	form,
	tags: abusiveTags,
	status
}: {
	form: FormType<ClearCutFormInput>
	tags: Rule[]
	status: ClearCutStatus
}) {
	const dispatch = useAppDispatch()
	const user = useConnectedMe()
	const filters = useAppSelector(selectFiltersRequest)

	const areaHectare = form.getValues("report.totalAreaHectare")
	const ecologicalZonings = form.getValues("ecologicalZonings")
	const reportId = form.getValues("report.id")
	const reportUserId = form.getValues("report.userId")
	// assignmentRequestedById is stored in the report but not in ClearCutForm schema yet; read from raw form values
	const assignmentRequestedById = (form.getValues("report") as any)
		?.assignmentRequestedById as string | null | undefined

	const isAdmin = user?.role === "admin"
	const myId = user?.id

	const refresh = () => {
		if (filters) dispatch(getClearCutsThunk(filters))
		window.location.reload()
	}

	const renderAssignmentSection = () => {
		if (!user) return null

		// Report already assigned to someone
		if (reportUserId) {
			if (reportUserId === myId || isAdmin) {
				return (
					<Button
						onClick={(e) => {
							e.preventDefault()
							if (window.confirm("Annuler l'attribution de cette coupe ?")) {
								dispatch(unassignReportThunk(reportId)).then(refresh)
							}
						}}
						className="w-full text-xs h-8"
						variant="destructive"
						size="sm"
					>
						Annuler l'attribution
					</Button>
				)
			}
			return (
				<p className="text-xs text-neutral-500 italic">
					Déjà attribuée à un autre bénévole
				</p>
			)
		}

		// Pending request exists
		if (assignmentRequestedById) {
			if (isAdmin) {
				// Admin sees approve / reject buttons
				return (
					<div className="flex flex-col gap-1">
						<p className="text-xs text-amber-600 font-medium">
							⏳ Demande d'attribution en attente
						</p>
						<div className="flex gap-1">
							<Button
								onClick={(e) => {
									e.preventDefault()
									dispatch(approveAssignmentThunk(reportId)).then(refresh)
								}}
								className="flex-1 text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
								size="sm"
							>
								Approuver
							</Button>
							<Button
								onClick={(e) => {
									e.preventDefault()
									dispatch(rejectAssignmentThunk(reportId)).then(refresh)
								}}
								className="flex-1 text-xs h-8"
								variant="destructive"
								size="sm"
							>
								Refuser
							</Button>
						</div>
					</div>
				)
			}
			if (assignmentRequestedById === myId) {
				// Volunteer who made the request can cancel it
				return (
					<div className="flex flex-col gap-1">
						<p className="text-xs text-amber-600 font-medium">
							⏳ Demande envoyée, en attente de validation
						</p>
						<Button
							onClick={(e) => {
								e.preventDefault()
								dispatch(cancelAssignRequestThunk(reportId)).then(refresh)
							}}
							className="w-full text-xs h-8"
							variant="outline"
							size="sm"
						>
							Annuler ma demande
						</Button>
					</div>
				)
			}
			// Another volunteer already requested it
			return (
				<p className="text-xs text-neutral-500 italic">
					Une demande d'attribution est déjà en cours
				</p>
			)
		}

		// No assignment and no pending request → volunteer can request
		return (
			<Button
				onClick={(e) => {
					e.preventDefault()
					if (
						window.confirm(
							"Demander à vous faire attribuer cette coupe rase ? Un administrateur devra valider votre demande."
						)
					) {
						dispatch(requestAssignReportThunk(reportId)).then(refresh)
					}
				}}
				className="w-full text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
				size="sm"
			>
				Demander l'attribution
			</Button>
		)
	}

	const renderAdminValidationSection = () => {
		if (!isAdmin || (status !== "to_validate" && status !== "waiting_for_validation")) return null

		return (
			<div className="flex flex-col gap-1 mb-2 mt-2 p-2 bg-amber-50 rounded-md border border-amber-200">
				<p className="text-xs text-amber-800 font-medium text-center">
					🚨 Analyse de la coupe en attente
				</p>
				<div className="flex gap-1">
					<Button
						onClick={(e) => {
							e.preventDefault()
							if (window.confirm("Valider cette coupe rase ?")) {
								dispatch(updateReportStatusThunk({ id: reportId, status: "validated" })).then(refresh)
							}
						}}
						className="flex-1 text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
						size="sm"
					>
						Valider
					</Button>
					<Button
						onClick={(e) => {
							e.preventDefault()
							if (window.confirm("Rejeter ce signalement ?")) {
								dispatch(updateReportStatusThunk({ id: reportId, status: "rejected" })).then(refresh)
							}
						}}
						className="flex-1 text-xs h-8"
						variant="destructive"
						size="sm"
					>
						Rejeter
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="flex items-center mx-4 mt-2 gap-6 text-sm border-b-1 pb-1">
			{form.getValues("report.satelliteImages")?.map((image) => (
				<img
					key={image}
					alt="Vue satellite de le coupe rase"
					src={image}
					loading="lazy"
					className="flex-1 aspect-square shadow-[0px_2px_6px_0px_#00000033] rounded-lg max-w-[45%]"
				/>
			))}

			<div className="flex-1">
				<div className="flex flex-col gap-2 mb-2">
					<StatusWithLabel status={status} />
					{renderAdminValidationSection()}
					{renderAssignmentSection()}
				</div>
				<div className="flex gap-2 flex-wrap mb-2">
					{abusiveTags.map((tag) => (
						<RuleBadge className="max-w-fit" key={tag.id} {...tag} />
					))}
				</div>
				{areaHectare !== undefined && (
					<p>
						Superficie de la coupe : <FormattedNumber value={areaHectare} /> ha
					</p>
				)}
				{ecologicalZonings && ecologicalZonings.length > 0 && (
					<p>
						Zones écologiques :{" "}
						{ecologicalZonings.map((z) => z.name).join(", ")}
					</p>
				)}
			</div>
		</div>
	)
}
