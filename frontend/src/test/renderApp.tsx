import { MapProvider } from "@/features/clear-cutting/components/map/Map.context";
import {
	type AuthContext,
	AuthProvider,
	useAuth,
} from "@/features/user/components/Auth.context";
import type { User } from "@/features/user/store/user";
import { routeTree } from "@/routeTree.gen";
import type { Routes as Route } from "@/shared/router";
import {
	type AppStore,
	type RootState,
	setupStore,
} from "@/shared/store/store";
import {
	RouterProvider,
	createMemoryHistory,
	createRouter,
} from "@tanstack/react-router";
import { type RenderOptions, render } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { Provider } from "react-redux";
interface Options extends Omit<RenderOptions, "queries"> {
	preloadedState?: Partial<RootState>;
	store?: AppStore;
	route?: Route;
	user?: User;
}

export function renderApp(options: Options) {
	const {
		preloadedState = {},
		// Automatically create a store instance if no store was passed in
		store = setupStore({
			...preloadedState,
			user: options.user
				? { status: "success", value: options.user }
				: preloadedState.user,
		}),
		route = options.route ?? "/",
		...renderOptions
	} = options;
	const history = createMemoryHistory({ initialEntries: [route] });
	const router = createRouter({
		routeTree,
		history,
		context: { auth: undefined as unknown as AuthContext },
	});
	function TestApp() {
		return (
			<AuthProvider>
				<MapProvider>
					<InnerTestApp />
				</MapProvider>
			</AuthProvider>
		);
	}
	function InnerTestApp() {
		const auth = useAuth();
		return <RouterProvider router={router} context={{ auth }} />;
	}

	const Wrapper = () => (
		<Provider store={store}>
			<TestApp />
		</Provider>
	);
	return {
		...render(<Wrapper />, renderOptions),
		user: userEvent.setup(),
	};
}
