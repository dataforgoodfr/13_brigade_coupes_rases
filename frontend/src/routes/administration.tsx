import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersListTab } from "@/features/admin/components/users-list/UsersListTab";
import { Title } from "@/shared/components/typo/Title";

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
		<div className="flex flex-col gap-4 grow p-8">
			<Title>ADMINISTRATION</Title>
			<Tabs defaultValue="users" className="grow">
				<TabsList>
					<TabsTrigger value="users">Utilisateurs</TabsTrigger>
					<TabsTrigger value="rules">Paramètres</TabsTrigger>
				</TabsList>
				<Outlet />
				<TabsContent value="users" className=" flex flex-col gap-8 grow p-4">
					<UsersListTab />
				</TabsContent>
				<TabsContent value="rules"></TabsContent>
			</Tabs>
		</div>
	);
}
