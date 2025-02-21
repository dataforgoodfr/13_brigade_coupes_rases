import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/administration")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/administration"!</div>;
}
