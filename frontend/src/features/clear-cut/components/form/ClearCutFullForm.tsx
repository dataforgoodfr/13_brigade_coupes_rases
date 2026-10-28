import { zodResolver } from "@hookform/resolvers/zod"
import { isUndefined } from "es-toolkit"
import { useEffect, useMemo } from "react"
import { FormProvider, useForm } from "react-hook-form"

import { Accordion } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog"
import { PendingFormNotice } from "@/features/clear-cut/components/PendingFormBadge"
import {
	type ClearCutForm,
	type ClearCutFormVersions,
	type ClearCutStatus,
	clearCutFormSchema
} from "@/features/clear-cut/store/clear-cuts"
import {
	persistClearCutCurrentForm,
	requestAssignReportThunk,
	selectAssignation,
	selectSubmission,
	submitClearCutFormThunk,
	volunteerValidateThunk
} from "@/features/clear-cut/store/clear-cuts-slice"
import { useConnectedMe, useMe } from "@/features/user/store/me.slice"
import { useToast } from "@/hooks/use-toast"
import { useUploadingTracker } from "@/shared/form/UploadingContext"
import { useSingleFlight } from "@/shared/hooks/singleFlight"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus"

import AccordionContent from "./AccordionContent"
import { AccordionHeader } from "./AccordionHeader"

type Props = ClearCutFormVersions

const VOLUNTEER_LOCKED_STATUSES: ClearCutStatus[] = [
	"waiting_for_validation",
	"validated",
	"legal_validated",
	"final_validated",
	"rejected"
]

export function ClearCutFullForm({ current, original, latest }: Props) {
	const dispatch = useAppDispatch()
	const singleFlight = useSingleFlight()
	const submission = useAppSelector(selectSubmission)
	const assignation = useAppSelector(selectAssignation)
	const loggedUser = useMe()
	const user = useConnectedMe()
	const { isUploading } = useUploadingTracker()
	const isOnline = useOnlineStatus()

	const isAssignedVolunteer = useMemo(() => {
		if (user?.role !== "volunteer") return false
		return (
			current.report.userId === user.id ||
			current.report.affectedUser?.login === user.login
		)
	}, [user, current.report.userId, current.report.affectedUser])

	// Once sent for validation, a report's form is the admins' to correct
	const isLockedForVolunteer =
		user?.role === "volunteer" &&
		VOLUNTEER_LOCKED_STATUSES.includes(current.report.status)

	const isDisabled = useMemo(() => {
		if (!user) return true
		if (user.role === "volunteer") {
			if (isLockedForVolunteer) return true
			const isAssignmentRequester =
				current.report.assignmentRequestedById === user.id
			return !isAssignedVolunteer && !isAssignmentRequester
		}
		return false
	}, [
		user,
		isLockedForVolunteer,
		isAssignedVolunteer,
		current.report.assignmentRequestedById
	])

	const canValidate =
		isAssignedVolunteer && current.report.status === "in_progress"

	const canRequestAssignment =
		user?.role === "volunteer" &&
		!current.report.userId &&
		!current.report.assignmentRequestedById &&
		current.report.status === "to_validate"

	const hasPendingRequest =
		user?.role === "volunteer" &&
		current.report.assignmentRequestedById === user.id

	const handleRequestAssignment = () =>
		singleFlight(() => dispatch(requestAssignReportThunk(current.report.id)))

	const form = useForm({
		resolver: zodResolver(clearCutFormSchema),
		values: current,
		defaultValues: original,
		disabled: isDisabled
	})

	useEffect(() => {
		form.watch((values) => {
			const clearCutForm = clearCutFormSchema.safeParse(values).data
			if (!isUndefined(clearCutForm)) {
				dispatch(persistClearCutCurrentForm(clearCutForm))
			}
		})
	}, [form, dispatch])

	const { toast } = useToast()

	const handleSubmit = (formData: ClearCutForm) =>
		singleFlight(() =>
			dispatch(
				submitClearCutFormThunk({
					reportId: current.report.id,
					formData
				})
			)
		)

	const handleValidate = () =>
		singleFlight(() => dispatch(volunteerValidateThunk(current.report.id)))

	useEffect(() => {
		if (submission.status === "success") {
			toast({ id: "edited-form", title: "Formulaire sauvegardé" })
		} else if (submission.status === "error") {
			// Distinguish a network outage from a server error: when offline the
			// save simply can't reach the server, but the data is safe locally.
			toast(
				navigator.onLine
					? {
							id: "form-edition-error",
							title: "Erreur lors de la sauvegarde du formulaire !"
						}
					: {
							id: "form-edition-error",
							title: "Saisie gardée sur cet appareil",
							description:
								"Hors connexion : elle sera envoyée automatiquement au retour du réseau."
						}
			)
		}
	}, [submission.status, toast])

	useEffect(() => {
		if (assignation.status === "success") {
			toast({
				id: "assignation-action",
				title: "Demande envoyée à l'administrateur"
			})
		} else if (assignation.status === "error") {
			toast({
				id: "validation-error",
				title: "Erreur lors de la demande de validation"
			})
		}
	}, [assignation.status, toast])

	return (
		<>
			<AccordionHeader
				form={form}
				tags={current.report.rules}
				status={current.report.status}
			/>
			<FormProvider {...form}>
				<form
					onSubmit={form.handleSubmit(handleSubmit)}
					className="flex flex-col grow px-4 h-0"
				>
					<Accordion type="multiple" className="grow overflow-y-auto">
						<AccordionContent original={original} form={form} latest={latest} />
					</Accordion>
					{!!loggedUser && (
						<div className="flex flex-col gap-2 pt-2 pb-4">
							{canRequestAssignment && (
								<Button
									type="button"
									className="w-full cursor-pointer"
									size="lg"
									disabled={assignation.status === "loading"}
									onClick={handleRequestAssignment}
								>
									{assignation.status === "loading"
										? "Envoi en cours..."
										: "Demander l'attribution"}
								</Button>
							)}
							{hasPendingRequest && (
								<p className="text-sm text-amber-600 font-medium text-center py-2">
									⏳ Demande d'attribution en attente de validation
								</p>
							)}
							{isLockedForVolunteer && isAssignedVolunteer && (
								<p className="text-sm text-neutral-600 font-medium text-center py-1">
									🔒 Fiche envoyée en validation : elle n'est plus modifiable.
									Un administrateur peut encore la corriger.
								</p>
							)}
							{!isOnline && (
								<p className="text-sm text-amber-600 font-medium text-center py-1">
									📡 Hors connexion — vos saisies sont enregistrées sur cet
									appareil. « Sauvegarder » les enverra au retour du réseau.
								</p>
							)}
							<PendingFormNotice reportId={current.report.id} />
							<Button
								type="submit"
								variant="outline"
								className="w-full cursor-pointer"
								size="lg"
								disabled={
									isDisabled || submission.status === "loading" || isUploading
								}
							>
								{submission.status === "loading"
									? "Enregistrement..."
									: isUploading
										? "Envoi des photos en cours…"
										: "Sauvegarder"}
							</Button>
							{canValidate && (
								<Dialog>
									<DialogTrigger asChild>
										<Button
											type="button"
											className="w-full font-bold cursor-pointer"
											size="lg"
											disabled={assignation.status === "loading" || isUploading}
										>
											{assignation.status === "loading"
												? "Envoi en cours..."
												: "Valider la coupe"}
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Valider la coupe</DialogTitle>
											<DialogDescription>
												Êtes-vous sûr.e de vouloir valider ce formulaire ?
											</DialogDescription>
										</DialogHeader>
										<DialogFooter>
											<DialogClose asChild>
												<Button variant="zinc">Annuler</Button>
											</DialogClose>
											<DialogClose asChild>
												<Button
													className="font-bold cursor-pointer"
													onClick={handleValidate}
												>
													Valider
												</Button>
											</DialogClose>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							)}
						</div>
					)}
				</form>
			</FormProvider>
		</>
	)
}
