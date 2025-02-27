import { AuthProvider, useAuth } from "@/features/user/components/Auth.context";
import { router } from "@/shared/router";
import { RouterProvider } from "@tanstack/react-router";

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
