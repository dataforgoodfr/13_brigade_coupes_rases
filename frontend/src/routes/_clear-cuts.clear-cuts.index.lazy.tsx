import { LayoutProvider } from "@/features/clear-cut/components/Layout.context";
import { MobileLayout } from "@/features/clear-cut/components/MobileLayout";
import { AsideList } from "@/features/clear-cut/components/list/AsideList";
import { useBreakpoint } from "@/shared/hooks/breakpoint";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_clear-cuts/clear-cuts/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { breakpoint } = useBreakpoint();
	return (
		<LayoutProvider>
			{breakpoint === "mobile" ? (
				<MobileLayout />
			) : (
				<div className="sm:flex hidden xxl:w-1/4 w-3/4 lg:w-1/3">
					<AsideList />
				</div>
			)}
		</LayoutProvider>
	);
}
