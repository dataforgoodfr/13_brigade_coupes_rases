import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RulesPage } from "@/features/admin/components/rules/RulesPage";
import { UsersListPage } from "@/features/admin/components/users-list/UsersListPage";
import { Title } from "@/shared/components/typo/Title";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/administration")({
	beforeLoad: async ({ context, location }) => {
		// If not authenticated, redirect to login with redirect param
		if (!context?.auth?.isAuthenticated) {
			throw redirect({
				to: "/login",
				search: { redirect: location.href },
			});
		}
		// If authenticated but not admin, redirect to home (prevents infinite loop)
		if (!context?.auth?.isAdmin) {
			throw redirect({
				to: "/",
			});
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col gap-4 w-full h-full p-8">
			<Title>ADMINISTRATION</Title>
			<Tabs defaultValue="users" className="w-full h-full ">
				<TabsList>
					<TabsTrigger value="users">Utilisateurs</TabsTrigger>
					<TabsTrigger value="rules">Paramètres</TabsTrigger>
				</TabsList>
				<Outlet />
				<TabsContent value="users">
					<UsersListPage />
				</TabsContent>
				<TabsContent value="rules">
					<RulesPage />
				</TabsContent>
			</Tabs>
		</div>
	);
}
