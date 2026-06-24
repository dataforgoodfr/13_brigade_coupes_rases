import { FormattedNumber } from "react-intl"

import { Button } from "@/components/ui/button"
import type {
	ClearCutFormInput,
	ClearCutStatus
} from "@/features/clear-cut/store/clear-cuts"
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
import { useToast } from "@/hooks/use-toast"
import type { FormType } from "@/shared/form/types"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"
import type { Rule } from "@/shared/store/referential/referential"

import { RuleBadge } from "../RuleBadge"
import { StatusWithLabel } from "../StatusWithLabel"

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
	const { toast } = useToast()

	const areaHectare = form.getValues("report.totalAreaHectare")
	const ecologicalZonings = form.getValues("ecologicalZonings")
	const reportId = form.getValues("report.id")
	const reportUserId = form.getValues("report.userId")
	const report = form.getValues("report") as any
	const assignmentRequestedById = report?.assignmentRequestedById as
		| string
		| null
		| undefined
	const affectedUserLogin = report?.affectedUser?.login as
		| string
		| null
		| undefined
	const assignmentRequestedByLogin = report?.assignmentRequestedBy?.login as
		| string
		| null
		| undefined

	const isAdmin = user?.role === "admin"
	const myId = user?.id

	const refresh = () => {
		if (filters) dispatch(getClearCutsThunk(filters))
		window.location.reload()
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const dispatchAndRefresh = async (thunk: any, errorMessage: string) => {
		const action = await dispatch(thunk)
		if (action.type.endsWith("/rejected")) {
			toast({
				id: "assignment-error",
				title: "Erreur",
				description: errorMessage
			})
		} else {
			refresh()
		}
	}

	const renderAssignmentSection = () => {
		if (!user) return null

		// Report already assigned to someone
		if (reportUserId) {
			if (reportUserId === myId || isAdmin) {
				return (
					<div className="flex flex-col gap-1">
						<p className="text-xs text-green-700 font-semibold">
							✓ Attribuée à{" "}
							<span className="font-bold">
								{affectedUserLogin ??
									(reportUserId === myId ? "vous" : "un bénévole")}
							</span>
						</p>
						<Button
							type="button"
							onClick={() => {
								dispatchAndRefresh(
									unassignReportThunk(reportId),
									"Impossible d'annuler l'attribution."
								)
							}}
							className="w-full text-xs h-8 cursor-pointer"
							variant="destructive"
							size="sm"
						>
							Annuler l'attribution
						</Button>
					</div>
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
				return (
					<div className="flex flex-col gap-1">
						<p className="text-xs text-amber-600 font-medium">
							⏳ Demande de{" "}
							<span className="font-bold">
								{assignmentRequestedByLogin ?? "un bénévole"}
							</span>{" "}
							en attente
						</p>
						<div className="flex gap-1">
							<Button
								type="button"
								onClick={() => {
									dispatchAndRefresh(
										approveAssignmentThunk(reportId),
										"Impossible d'approuver la demande."
									)
								}}
								className="flex-1 text-xs h-8 border-green-600 text-green-700 hover:bg-green-50 cursor-pointer"
								variant="outline"
								size="sm"
							>
								Approuver
							</Button>
							<Button
								type="button"
								onClick={() => {
									dispatchAndRefresh(
										rejectAssignmentThunk(reportId),
										"Impossible de refuser la demande."
									)
								}}
								className="flex-1 text-xs h-8 border-destructive text-destructive hover:bg-destructive/10 cursor-pointer"
								variant="outline"
								size="sm"
							>
								Refuser
							</Button>
						</div>
					</div>
				)
			}
			if (assignmentRequestedById === myId) {
				return (
					<div className="flex flex-col gap-1">
						<p className="text-xs text-amber-600 font-medium">
							⏳ Demande envoyée, en attente de validation
						</p>
						<Button
							type="button"
							onClick={() => {
								dispatchAndRefresh(
									cancelAssignRequestThunk(reportId),
									"Impossible d'annuler la demande."
								)
							}}
							className="w-full text-xs h-8 cursor-pointer"
							variant="outline"
							size="sm"
						>
							Annuler ma demande
						</Button>
					</div>
				)
			}
			return (
				<p className="text-xs text-neutral-500 italic">
					Une demande d'attribution est déjà en cours
				</p>
			)
		}

		// No assignment and no pending request → volunteer can request
		return (
			<Button
				type="button"
				onClick={() => {
					dispatchAndRefresh(
						requestAssignReportThunk(reportId),
						"Impossible de demander l'attribution."
					)
				}}
				className="w-full text-xs h-8 cursor-pointer"
				variant="default"
				size="sm"
			>
				Demander l'attribution
			</Button>
		)
	}

	const renderAdminValidationSection = () => {
		if (
			!isAdmin ||
			(status !== "to_validate" && status !== "waiting_for_validation")
		)
			return null

		return (
			<div className="flex flex-col gap-1 mb-2 mt-2 p-2 bg-amber-50 rounded-md border border-amber-200">
				<p className="text-xs text-amber-800 font-medium text-center">
					🚨 Analyse de la coupe en attente
				</p>
				<div className="flex gap-1">
					<Button
						type="button"
						onClick={() => {
							dispatchAndRefresh(
								updateReportStatusThunk({ id: reportId, status: "validated" }),
								"Impossible de valider le signalement."
							)
						}}
						className="flex-1 text-xs h-8 cursor-pointer"
						variant="default"
						size="sm"
					>
						Valider
					</Button>
					<Button
						type="button"
						onClick={() => {
							dispatchAndRefresh(
								updateReportStatusThunk({ id: reportId, status: "rejected" }),
								"Impossible de rejeter le signalement."
							)
						}}
						className="flex-1 text-xs h-8 cursor-pointer"
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
