import { Toaster } from "@/components/ui/toaster";
import { useReloadPwa } from "@/features/offline/hooks/useReloadPwa";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	useReloadPwa();
	return (
		<>
			<Outlet />
			<Toaster />
			<TanStackRouterDevtools />
		</>
	);
}
