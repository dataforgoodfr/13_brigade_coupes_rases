import { AsideForm } from "@/features/clear-cut/components/form/AsideForm";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_clear-cuts/clear-cuts/$clearCutId")(
	{
		component: RouteComponent,
	},
);

function RouteComponent() {
	const params = Route.useParams();
	return <AsideForm clearCutId={params.clearCutId} />;
}
