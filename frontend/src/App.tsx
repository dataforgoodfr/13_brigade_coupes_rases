import { MapProvider } from "@/features/clear-cutting/components/map/Map.context";
import { AuthProvider, useAuth } from "@/features/user/components/Auth.context";
import { router } from "@/shared/router";
import { RouterProvider } from "@tanstack/react-router";

export function App() {
	return (
		<AuthProvider>
			<MapProvider>
				<InnerApp />
			</MapProvider>
		</AuthProvider>
	);
}
function InnerApp() {
	const auth = useAuth();
	return <RouterProvider router={router} context={{ auth }} />;
}
