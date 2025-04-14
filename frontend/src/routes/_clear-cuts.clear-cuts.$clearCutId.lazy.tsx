import { LayoutProvider } from "@/features/clear-cut/components/Layout.context";
import { AsideForm } from "@/features/clear-cut/components/form/AsideForm";
import { useBreakpoint } from "@/shared/hooks/breakpoint";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_clear-cuts/clear-cuts/$clearCutId")(
	{
		component: RouteComponent,
	},
);

function RouteComponent() {
	const { breakpoint } = useBreakpoint();
	const params = Route.useParams();
	return (
		<LayoutProvider>
			{breakpoint === "mobile" ? (
				<AsideForm clearCutId={params.clearCutId} />
			) : (
				<div className="sm:flex hidden w-1/4">
					<AsideForm clearCutId={params.clearCutId} />
				</div>
			)}
		</LayoutProvider>
	);
}
