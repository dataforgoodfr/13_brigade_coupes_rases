import { Title } from "@radix-ui/react-toast"
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
	const { map } = useMapInstance()
	const { toast } = useToast()
	const navigate = useNavigate()
	const { breakpoint } = useBreakpoint()
	const dispatch = useAppDispatch()

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

	useEffect(() => {
		if (
			map &&
			breakpoint === "all" &&
			value?.current.report.averageLocation.coordinates
		) {
			map.flyTo(
				[
					value.current.report.averageLocation.coordinates[1],
					value.current.report.averageLocation.coordinates[0]
				],
				15,
				{ duration: 1 }
			)
		}
	}, [breakpoint, map, value])

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
		value && (
			<div
				className={cn("flex flex-col w-full bg-background", {
					"absolute top-0 left-0 right-0 bottom-12 z-10": mobile
				})}
			>
				<div className="pt-4 px-4 pb-1 border-b-1 flex align-middle justify-between">
					<div className="flex flex-col">
						<Title>{`${value.current.report.city.toLocaleUpperCase()}`}</Title>
						<span className="font-[Roboto]">
							<FormattedDate value={value.current.report.firstCutDate} />
						</span>
						<span className="font-[Roboto] italic font-light text-xs">
							v{value.current.id ?? 0}
						</span>
					</div>
					<Link to="/clear-cuts">
						<X size={30} />
					</Link>
				</div>
				<ClearCutFullForm {...value} />
			</div>
		)
	)
}
