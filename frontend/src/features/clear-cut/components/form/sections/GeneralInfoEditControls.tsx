import { Pencil } from "lucide-react"
import { useEffect, useId, useMemo, useState } from "react"
import { FormattedDate } from "react-intl"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { ClearCutFormInput } from "@/features/clear-cut/store/clear-cuts"
import {
	setPipelineOverrideThunk,
	updateClearCutGeometryThunk,
	updateReportInfoThunk
} from "@/features/clear-cut/store/clear-cuts-slice"
import { getStoredToken, useConnectedMe } from "@/features/user/store/me.slice"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/shared/api/api"
import type { FormType } from "@/shared/form/types"
import { useAppDispatch } from "@/shared/hooks/store"

type CitySearchResult = {
	insee_code: string
	name: string
	department_code: string
}

function authedApi() {
	const token = getStoredToken() as { accessToken?: string } | null
	return token?.accessToken
		? api.extend({ headers: { Authorization: `Bearer ${token.accessToken}` } })
		: api
}

const dateInputClass =
	"flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"

/**
 * Lets admins and the assigned volunteer correct the initial report information
 * (commune, date de signalement, dates de coupe) and signals/controls manual
 * edition. Rendered inside the "Informations générales" accordion section.
 */
export function GeneralInfoEditControls({
	form
}: {
	form: FormType<ClearCutFormInput>
}) {
	const report = form.watch("report")
	const user = useConnectedMe()
	const dispatch = useAppDispatch()
	const { toast } = useToast()

	const canEdit = useMemo(() => {
		if (!user) return false
		return user.role === "admin" || report.userId === user.id
	}, [user, report.userId])

	// Cut dates are stored per clear cut. When a report holds a single cut we can
	// edit its observation window directly; with several cuts we only expose the
	// report-level fields (perimeter/date edits are then done per cut on the map).
	const singleCut =
		report.clearCuts.length === 1 ? report.clearCuts[0] : undefined

	const [open, setOpen] = useState(false)
	const [reportedAt, setReportedAt] = useState(
		report.reportedAt ?? report.createdAt
	)
	const [startDate, setStartDate] = useState(
		singleCut?.observationStartDate ?? report.firstCutDate
	)
	const [endDate, setEndDate] = useState(
		singleCut?.observationEndDate ?? report.lastCutDate
	)
	const [citySearch, setCitySearch] = useState("")
	const [cityResults, setCityResults] = useState<CitySearchResult[]>([])
	const [selectedCity, setSelectedCity] = useState<CitySearchResult | null>(
		null
	)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const reportedAtId = useId()
	const startDateId = useId()
	const endDateId = useId()
	const citySearchId = useId()
	const overrideId = useId()

	// Snapshot the dialog fields from fresh report data each time it opens.
	const handleOpenChange = (next: boolean) => {
		if (next) {
			setReportedAt(report.reportedAt ?? report.createdAt)
			setStartDate(singleCut?.observationStartDate ?? report.firstCutDate)
			setEndDate(singleCut?.observationEndDate ?? report.lastCutDate)
			setSelectedCity(null)
			setCitySearch("")
			setCityResults([])
		}
		setOpen(next)
	}

	useEffect(() => {
		if (citySearch.length < 2) {
			setCityResults([])
			return
		}
		const timeout = setTimeout(async () => {
			try {
				const results = await authedApi()
					.get("api/v1/cities/search", { searchParams: { q: citySearch } })
					.json<CitySearchResult[]>()
				setCityResults(results)
			} catch {
				setCityResults([])
			}
		}, 250)
		return () => clearTimeout(timeout)
	}, [citySearch])

	if (!canEdit && !report.isManuallyEdited) {
		return null
	}

	const handleSave = async () => {
		setIsSubmitting(true)
		try {
			await dispatch(
				updateReportInfoThunk({
					reportId: report.id,
					reportedAt,
					cityZipCode: selectedCity?.insee_code
				})
			).unwrap()

			if (
				singleCut &&
				(startDate !== singleCut.observationStartDate ||
					endDate !== singleCut.observationEndDate)
			) {
				await dispatch(
					updateClearCutGeometryThunk({
						reportId: report.id,
						clearCutId: singleCut.id,
						observationStartDate: startDate,
						observationEndDate: endDate
					})
				).unwrap()
			}

			toast({ id: "report-info-updated", title: "Informations mises à jour" })
			setOpen(false)
		} catch {
			toast({
				id: "report-info-error",
				title: "Erreur lors de la mise à jour des informations"
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleToggleOverride = async (allow: boolean) => {
		try {
			await dispatch(
				setPipelineOverrideThunk({ reportId: report.id, allow })
			).unwrap()
		} catch {
			toast({
				id: "pipeline-override-error",
				title: "Erreur lors de la mise à jour du paramètre"
			})
		}
	}

	return (
		<div className="flex flex-col gap-2 mt-2">
			{report.isManuallyEdited && (
				<Badge
					variant="secondary"
					className="w-fit gap-1 bg-amber-100 text-amber-800"
				>
					<Pencil size={12} />
					Édité manuellement
					{report.manuallyEditedAt && (
						<>
							{" le "}
							<FormattedDate value={report.manuallyEditedAt} />
						</>
					)}
				</Badge>
			)}

			{canEdit && (
				<Dialog open={open} onOpenChange={handleOpenChange}>
					<DialogTrigger asChild>
						<Button type="button" variant="outline" size="sm" className="w-fit">
							<Pencil size={14} className="mr-1" />
							Modifier les informations
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>Modifier les informations</DialogTitle>
							<DialogDescription>
								Corrigez les informations initiales de la coupe.
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col gap-4 py-2">
							<div className="flex flex-col gap-1">
								<Label htmlFor={reportedAtId}>Date de signalement</Label>
								<input
									id={reportedAtId}
									type="date"
									className={dateInputClass}
									value={reportedAt}
									onChange={(e) => setReportedAt(e.target.value)}
								/>
							</div>
							{singleCut ? (
								<div className="grid grid-cols-2 gap-2">
									<div className="flex flex-col gap-1">
										<Label htmlFor={startDateId}>Début de la coupe</Label>
										<input
											id={startDateId}
											type="date"
											className={dateInputClass}
											value={startDate}
											onChange={(e) => setStartDate(e.target.value)}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label htmlFor={endDateId}>Fin de la coupe</Label>
										<input
											id={endDateId}
											type="date"
											className={dateInputClass}
											value={endDate}
											onChange={(e) => setEndDate(e.target.value)}
										/>
									</div>
								</div>
							) : (
								<p className="text-xs text-neutral-500">
									Ce signalement regroupe plusieurs coupes : les dates de coupe
									se modifient zone par zone sur la carte.
								</p>
							)}
							<div className="flex flex-col gap-1">
								<Label htmlFor={citySearchId}>Commune</Label>
								<div className="relative">
									<input
										id={citySearchId}
										placeholder={report.city}
										value={
											selectedCity
												? `${selectedCity.name} (${selectedCity.department_code})`
												: citySearch
										}
										onChange={(e) => {
											setSelectedCity(null)
											setCitySearch(e.target.value)
										}}
										autoComplete="off"
										className={dateInputClass}
									/>
									{cityResults.length > 0 && !selectedCity && (
										<ul className="absolute z-50 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-md max-h-48 overflow-y-auto">
											{cityResults.map((city) => (
												<li
													key={city.insee_code}
													className="cursor-pointer px-3 py-2 text-sm hover:bg-neutral-100"
													onMouseDown={(e) => {
														e.preventDefault()
														setSelectedCity(city)
														setCitySearch("")
														setCityResults([])
													}}
												>
													{city.name}
													<span className="ml-1 text-neutral-400 text-xs">
														({city.department_code})
													</span>
												</li>
											))}
										</ul>
									)}
								</div>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setOpen(false)}
								disabled={isSubmitting}
							>
								Annuler
							</Button>
							<Button onClick={handleSave} disabled={isSubmitting}>
								{isSubmitting ? "Enregistrement..." : "Enregistrer"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{canEdit && report.isManuallyEdited && (
				<div className="flex items-center gap-2 mt-1">
					<Switch
						id={overrideId}
						checked={report.allowPipelineOverride ?? false}
						onCheckedChange={handleToggleOverride}
					/>
					<Label htmlFor={overrideId} className="text-xs font-normal">
						Autoriser la mise à jour automatique par le pipeline (écrase les
						corrections manuelles)
					</Label>
				</div>
			)}
		</div>
	)
}
