import { UsersListPage } from "@/features/admin/components/UsersListPage";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_administration/users")({
	component: RouteComponent,
});

function RouteComponent() {
	return <UsersListPage />;
}
