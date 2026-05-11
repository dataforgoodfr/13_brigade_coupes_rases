import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ActionRequiredTab } from "@/features/admin/components/action-required/ActionRequiredTab"
import { ReportsTrackingTab } from "@/features/admin/components/reports-list/ReportsTrackingTab"
import { RulesTab } from "@/features/admin/components/rules/RulesTab"
import { UsersListTab } from "@/features/admin/components/users-list/UsersListTab"
import { Title } from "@/shared/components/typo/Title"

export const Route = createFileRoute("/administration")({
	beforeLoad: async ({ context, location }) => {
		// If not authenticated, redirect to login with redirect param
		if (!context?.auth?.isAuthenticated) {
			throw redirect({
				to: "/login",
				search: { redirect: location.href }
			})
		}
		// If authenticated but not admin, redirect to home (prevents infinite loop)
		if (!context?.auth?.isAdmin) {
			throw redirect({
				to: "/"
			})
		}
	},
	component: RouteComponent
})

function RouteComponent() {
	return (
		<div className="flex flex-col gap-4 grow p-4 sm:p-8 overflow-x-auto">
			<Title>ADMINISTRATION</Title>
			<Tabs defaultValue="action-required" className="grow">
				<TabsList>
					<TabsTrigger value="action-required">Actions Requises</TabsTrigger>
					<TabsTrigger value="reports">Suivi des Zones</TabsTrigger>
					<TabsTrigger value="users">Utilisateurs</TabsTrigger>
					<TabsTrigger value="rules">Paramètres</TabsTrigger>
				</TabsList>
				<Outlet />
				<TabsContent value="action-required" className="flex flex-col gap-8 grow p-4">
					<ActionRequiredTab />
				</TabsContent>
				<TabsContent value="reports" className="flex flex-col gap-8 grow p-4">
					<ReportsTrackingTab />
				</TabsContent>
				<TabsContent value="users" className=" flex flex-col gap-8 grow p-4">
					<UsersListTab />
				</TabsContent>
				<TabsContent value="rules">
					<RulesTab />
				</TabsContent>
			</Tabs>
		</div>
	)
}
