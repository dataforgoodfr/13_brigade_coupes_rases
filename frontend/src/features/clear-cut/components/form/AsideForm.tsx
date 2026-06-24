import { Link, useNavigate } from "@tanstack/react-router"
import { X } from "lucide-react"
import { useEffect } from "react"
import { FormattedDate } from "react-intl"

import { Button } from "@/components/ui/button"
import { ClearCutFullForm } from "@/features/clear-cut/components/form/ClearCutFullForm"
import { useMapInstance } from "@/features/clear-cut/components/map/Map.context"
import {
	clearCutsSlice,
	useGetClearCut
} from "@/features/clear-cut/store/clear-cuts-slice"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Loading } from "@/shared/components/Loading"
import { Title } from "@/shared/components/typo/Title"
import { UploadingProvider } from "@/shared/form/UploadingContext"
import { useBreakpoint } from "@/shared/hooks/breakpoint"
import { useAppDispatch } from "@/shared/hooks/store"

export function AsideForm({
	clearCutId,
	mobile
}: {
	clearCutId: string
	mobile?: boolean
}) {
	const { value, status } = useGetClearCut(clearCutId)
	const { map, setFocusedClearCutId } = useMapInstance()
	const { toast } = useToast()
	const navigate = useNavigate()
	const { breakpoint } = useBreakpoint()
	const dispatch = useAppDispatch()

	useEffect(() => {
		setFocusedClearCutId(clearCutId)
		return () => setFocusedClearCutId(undefined)
	}, [clearCutId, setFocusedClearCutId])

	useEffect(() => {
		if (status === "error") {
			toast({
				id: "report-not-found",
				title: "Fiche non trouvée",
				description: "Fermer pour retourner à la carte",
				onClose: () => {
					navigate({ to: "/clear-cuts" })
				}
			})
		}
	}, [status, navigate, toast])

	// Re-center only when the displayed report changes, not on every `value`
	// update (e.g. the background refresh that follows a save), otherwise the
	// map would jump back each time the form is auto-refreshed.
	const averageCoordinates = value?.current.report.averageLocation.coordinates
	const averageLat = averageCoordinates?.[1]
	const averageLng = averageCoordinates?.[0]
	useEffect(() => {
		if (
			map &&
			breakpoint === "all" &&
			averageLat !== undefined &&
			averageLng !== undefined
		) {
			map.flyTo([averageLat, averageLng], 15, { duration: 1 })
		}
	}, [breakpoint, map, averageLat, averageLng])

	useEffect(() => {
		if (value?.versionMismatchDisclaimerShown === false) {
			const { dismiss } = toast({
				id: "outdated-form",
				title: "Nouvelle version disponible",
				description: "Mettez à jour votre formulaire",
				action: (
					<Button
						onClick={() => {
							dismiss()
							dispatch(clearCutsSlice.actions.replaceCurrentVersionByLatest())
						}}
					>
						Mettre à jour
					</Button>
				)
			})
		}
	}, [toast, value, dispatch])

	return (
		<div
			className={cn("flex flex-col w-full bg-background", {
				"absolute top-0 left-0 right-0 bottom-16 z-10": mobile
			})}
		>
			<div
				className={cn(
					"pt-4 px-4 pb-1 border-b-1 flex align-middle justify-between",
					status === "loading" && !value && "justify-end"
				)}
			>
				{value ? (
					<div className="flex flex-col">
						<Title>{`${value.current.report.city.toLocaleUpperCase()}`}</Title>
						<span className="font-[Roboto]">
							<FormattedDate value={value.current.report.firstCutDate} />
						</span>
						<span className="font-[Roboto] italic font-light text-xs">
							v{value.current.id ?? 0}
						</span>
					</div>
				) : null}
				<Link to="/clear-cuts">
					<X size={30} />
				</Link>
			</div>
			{status === "loading" && !value && (
				<div className="flex h-full justify-center items-center">
					<Loading className="w-1/2" />
				</div>
			)}
			{value && (
				<UploadingProvider>
					<ClearCutFullForm {...value} />
				</UploadingProvider>
			)}
		</div>
	)
}
