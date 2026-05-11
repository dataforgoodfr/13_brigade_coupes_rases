import { useNavigate } from "@tanstack/react-router"
import { ChevronRight, FileWarning } from "lucide-react"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
	getMyAssignedReportsThunk,
	selectMyAssignedReports
} from "@/features/clear-cut/store/clear-cuts-slice"
import { TimeProgress } from "@/shared/components/TimeProgress"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"

export function MyCuts() {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const reportsState = useAppSelector(selectMyAssignedReports)

	useEffect(() => {
		dispatch(getMyAssignedReportsThunk({ page: 0, size: 50 }))
	}, [dispatch])

	if (reportsState.status === "idle" || reportsState.status === "loading") {
		return (
			<div className="flex h-full w-full justify-center items-center">
				<TimeProgress className="w-1/4" durationMs={1000} />
			</div>
		)
	}

	if (reportsState.status === "error") {
		return (
			<div className="flex flex-col h-full w-full justify-center items-center gap-4">
				<p>Erreur lors du chargement de vos coupes.</p>
				<Button
					onClick={() =>
						dispatch(getMyAssignedReportsThunk({ page: 0, size: 50 }))
					}
				>
					Réessayer
				</Button>
			</div>
		)
	}

	const reports = reportsState.value?.content ?? []

	return (
		<div className="flex flex-col w-full h-full p-6 sm:p-10 overflow-y-auto bg-neutral-50">
			<h1 className="text-3xl font-bold text-primary font-poppins mb-2">
				Mes Coupes
			</h1>
			<p className="text-neutral-600 mb-8 font-light">
				Retrouvez ici toutes les coupes rases qui vous ont été attribuées pour
				vérification.
			</p>

			{reports.length === 0 ? (
				<div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-neutral-100 mt-10">
					<div className="h-16 w-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
						<FileWarning className="h-8 w-8 text-neutral-400" />
					</div>
					<h3 className="text-lg font-medium text-neutral-800 mb-2">
						Aucune coupe attribuée
					</h3>
					<p className="text-neutral-500 text-center max-w-sm mb-6">
						Vous n'avez pas encore de coupe rase attribuée. Explorez la carte
						pour vous attribuer des signalements.
					</p>
					<Button onClick={() => navigate({ to: "/clear-cuts" })}>
						Aller sur la carte
					</Button>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{reports.map((report) => (
						<div
							key={report.id}
							className="bg-white p-5 rounded-xl shadow-sm border border-neutral-100 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer flex flex-col group"
							onClick={() => navigate({ to: `/clear-cuts/${report.id}` })}
						>
							<div className="flex justify-between items-start mb-3">
								<h3
									className="font-semibold text-lg text-neutral-800 truncate"
									title={report.city}
								>
									{report.city}
								</h3>
								<div className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-medium">
									{report.department.code}
								</div>
							</div>

							<div className="space-y-1 mb-6 flex-grow">
								<p className="text-sm text-neutral-600">
									<span className="font-medium text-neutral-900">
										Surface :
									</span>{" "}
									{report.totalAreaHectare.toFixed(1)} ha
								</p>
								<p className="text-sm text-neutral-600">
									<span className="font-medium text-neutral-900">
										Date approx. :
									</span>{" "}
									{new Date(report.lastCutDate).toLocaleDateString("fr-FR")}
								</p>
								<p className="text-sm text-neutral-600">
									<span className="font-medium text-neutral-900">Statut :</span>{" "}
									{report.status === "to_validate" ? "À valider" : "En cours"}
								</p>
							</div>

							<div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-sm font-medium text-primary group-hover:text-primary-dark transition-colors">
								<span>Consulter le détail</span>
								<ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
