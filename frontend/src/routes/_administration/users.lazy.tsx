import { UsersListPage } from "@/features/admin/components/users-list/UsersListPage";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_administration/users")({
	component: RouteComponent,
});

function RouteComponent() {
	return <UsersListPage />;
}
