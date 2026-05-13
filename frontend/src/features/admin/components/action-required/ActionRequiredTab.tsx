import { useNavigate } from "@tanstack/react-router"
import { ChevronRight, FileWarning } from "lucide-react"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
	getAdminActionRequiredReportsThunk,
	selectAdminActionRequiredReports
} from "@/features/clear-cut/store/clear-cuts-slice"
import { UpdateUserDialog } from "@/features/admin/components/users-list/UpdateUserDialog"
import { selectPendingUsers, useGetUsers } from "@/features/admin/store/users.slice"
import { TimeProgress } from "@/shared/components/TimeProgress"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"
import { UserIcon } from "lucide-react"

export function ActionRequiredTab() {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const reportsState = useAppSelector(selectAdminActionRequiredReports)
	const pendingUsers = useAppSelector(selectPendingUsers)
	
	useGetUsers()

	useEffect(() => {
		dispatch(getAdminActionRequiredReportsThunk({ page: 0, size: 50 }))
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
				<p>Erreur lors du chargement des coupes.</p>
				<Button
					onClick={() =>
						dispatch(getAdminActionRequiredReportsThunk({ page: 0, size: 50 }))
					}
				>
					Réessayer
				</Button>
			</div>
		)
	}

	const reports = reportsState.value?.content ?? []

	return (
		<div className="flex flex-col w-full h-full p-2 overflow-y-auto bg-white">
			<h2 className="text-2xl font-bold text-primary mb-2">
				Coupes nécessitant une action
			</h2>
			<p className="text-neutral-600 mb-6 font-light">
				Signalements de nouvelles coupes à valider ou demandes d'attribution en attente.
			</p>

			{pendingUsers.length > 0 && (
				<div className="mb-10">
					<h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
						<UserIcon className="h-5 w-5 text-amber-500" />
						Utilisateurs en attente de validation ({pendingUsers.length})
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{pendingUsers.map((user) => (
							<div
								key={user.id}
								className="bg-amber-50/30 p-5 rounded-xl border border-amber-100 flex flex-col gap-3"
							>
								<div className="flex justify-between items-start">
									<div>
										<p className="font-bold text-neutral-900">
											{user.firstName} {user.lastName}
										</p>
										<p className="text-xs text-neutral-500">{user.email}</p>
									</div>
									<div className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
										Nouveau
									</div>
								</div>
								<div className="flex items-center justify-between pt-2 border-t border-amber-100/50">
									<span className="text-xs text-neutral-600 italic">
										Inscrit le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
									</span>
									<UpdateUserDialog {...user} />
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{reports.length === 0 ? (
				<div className="flex flex-col items-center justify-center p-12 bg-neutral-50 rounded-xl shadow-sm border border-neutral-100 mt-4">
					<div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
						<FileWarning className="h-8 w-8 text-green-500" />
					</div>
					<h3 className="text-lg font-medium text-neutral-800 mb-2">
						Aucune action requise
					</h3>
					<p className="text-neutral-500 text-center max-w-sm mb-6">
						Toutes les demandes ont été traitées.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{reports.map((report) => (
						<div
							key={report.id}
							className="bg-white p-5 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer flex flex-col group relative overflow-hidden"
							onClick={() => navigate({ to: `/clear-cuts/${report.id}` })}
						>
							{/* Indicating the type of action needed */}
							{report.status === "to_validate" && (
								<div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold uppercase tracking-wider">
									Nouvelle Zone
								</div>
							)}
							{report.assignmentRequestedById && (
								<div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold uppercase tracking-wider">
									Demande Attribution
								</div>
							)}

							<div className="flex justify-between items-start mt-2 mb-3">
								<h3
									className="font-semibold text-lg text-neutral-800 truncate"
									title={report.city}
								>
									{report.city || "Ville Inconnue"}
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
									{report.totalAreaHectare?.toFixed(1) || 0} ha
								</p>
								<p className="text-sm text-neutral-600">
									<span className="font-medium text-neutral-900">
										Date de maj :
									</span>{" "}
									{new Date(report.updatedAt).toLocaleDateString("fr-FR")}
								</p>
							</div>

							<div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-sm font-medium text-primary group-hover:text-primary-dark transition-colors">
								<span>Traiter la demande</span>
								<ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
