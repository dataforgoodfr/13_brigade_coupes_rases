import { AppLayout } from "@/shared/components/AppLayout";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <AppLayout />;
}
