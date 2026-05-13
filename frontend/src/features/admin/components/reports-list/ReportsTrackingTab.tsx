import { useNavigate } from "@tanstack/react-router"
import { ChevronRight, Users, UserMinus, UserCheck } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
	getAdminAllReportsThunk,
	selectAdminAllReports
} from "@/features/clear-cut/store/clear-cuts-slice"
import { CLEAR_CUTTING_STATUS_TRANSLATIONS } from "@/features/clear-cut/store/status"
import { TimeProgress } from "@/shared/components/TimeProgress"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"
import { Badge } from "@/components/ui/badge"

export function ReportsTrackingTab() {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const reportsState = useAppSelector(selectAdminAllReports)
	const [filter, setFilter] = useState<"all" | "assigned" | "unassigned">("all")

	useEffect(() => {
		dispatch(getAdminAllReportsThunk({ page: 0, size: 100 }))
	}, [dispatch])

	if (reportsState.status === "idle" || reportsState.status === "loading") {
		return (
			<div className="flex h-full w-full justify-center items-center">
				<TimeProgress className="w-1/4" durationMs={1000} />
			</div>
		)
	}

	const allReports = reportsState.value?.content ?? []
	
	const filteredReports = allReports.filter(report => {
		if (filter === "assigned") return !!report.userId
		if (filter === "unassigned") return !report.userId
		return true
	})

	return (
		<div className="flex flex-col w-full h-full p-2 overflow-y-auto bg-white">
			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-6">
				<div>
					<h2 className="text-2xl font-bold text-primary mb-2">
						Suivi des Zones de Coupe
					</h2>
					<p className="text-neutral-600 font-light">
						Visualisez l'état d'avancement et les attributions de toutes les zones.
					</p>
				</div>
				<div className="flex gap-2 bg-neutral-100 p-1 rounded-lg">
					<Button 
						variant={filter === "all" ? "default" : "ghost"} 
						size="sm" 
						onClick={() => setFilter("all")}
						className="text-xs"
					>
						Tout
					</Button>
					<Button 
						variant={filter === "assigned" ? "default" : "ghost"} 
						size="sm" 
						onClick={() => setFilter("assigned")}
						className="text-xs"
					>
						Attribuées
					</Button>
					<Button 
						variant={filter === "unassigned" ? "default" : "ghost"} 
						size="sm" 
						onClick={() => setFilter("unassigned")}
						className="text-xs"
					>
						Non attribuées
					</Button>
				</div>
			</div>

			<div className="border rounded-xl overflow-x-auto shadow-sm">
				<table className="w-full min-w-[600px] text-left border-collapse">
					<thead>
						<tr className="bg-neutral-50 border-b border-neutral-200">
							<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Zone / Ville</th>
							<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Statut</th>
							<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Attribution</th>
							<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Surface</th>
							<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500 text-right">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-neutral-100">
						{filteredReports.map((report) => (
							<tr 
								key={report.id} 
								className="hover:bg-neutral-50 transition-colors cursor-pointer group"
								onClick={() => navigate({ to: `/clear-cuts/${report.id}` })}
							>
								<td className="px-6 py-4">
									<div className="flex flex-col">
										<span className="font-semibold text-neutral-800">{report.city}</span>
										<span className="text-xs text-neutral-500">Dept: {report.department.code}</span>
									</div>
								</td>
								<td className="px-6 py-4">
									<Badge variant="outline" className="font-medium">
										{CLEAR_CUTTING_STATUS_TRANSLATIONS[report.status]}
									</Badge>
								</td>
								<td className="px-6 py-4">
									{report.affectedUser ? (
										<div className="flex items-center gap-2 text-green-700">
											<UserCheck size={16} />
											<div className="flex flex-col">
												<span className="text-sm font-medium">{report.affectedUser.login}</span>
												<span className="text-[10px] opacity-70">{report.affectedUser.email}</span>
											</div>
										</div>
									) : report.assignmentRequestedBy ? (
										<div className="flex items-center gap-2 text-amber-600">
											<Users size={16} />
											<div className="flex flex-col">
												<span className="text-sm font-medium italic">{report.assignmentRequestedBy.login}</span>
												<span className="text-[10px] font-bold uppercase tracking-tighter">En attente</span>
											</div>
										</div>
									) : (
										<div className="flex items-center gap-2 text-neutral-400 italic">
											<UserMinus size={16} />
											<span className="text-sm">Non attribuée</span>
										</div>
									)}
								</td>
								<td className="px-6 py-4 text-sm text-neutral-600">
									{report.totalAreaHectare?.toFixed(1) || 0} ha
								</td>
								<td className="px-6 py-4 text-right">
									<Button variant="ghost" size="icon" className="group-hover:text-primary transition-colors">
										<ChevronRight size={20} />
									</Button>
								</td>
							</tr>
						))}
						{filteredReports.length === 0 && (
							<tr>
								<td colSpan={5} className="px-6 py-12 text-center text-neutral-500 italic">
									Aucune zone trouvée pour ce filtre.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	)
}
