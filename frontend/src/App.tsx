import { RouterProvider } from "@tanstack/react-router";
import { AuthProvider, useAuth } from "@/features/user/components/Auth.context";
import { router } from "@/shared/router";

export function App() {
	return (
		<AuthProvider>
			<InnerApp />
		</AuthProvider>
	);
}
function InnerApp() {
	const auth = useAuth();
	return <RouterProvider router={router} context={{ auth }} />;
}
