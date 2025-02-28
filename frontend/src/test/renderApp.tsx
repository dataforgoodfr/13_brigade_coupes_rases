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
type Split<S extends string, D extends string> = string extends S
	? string[]
	: S extends ""
		? []
		: S extends `${infer T}${D}${infer U}`
			? [T, ...Split<U, D>]
			: [S];
type RouteSegment<R extends Route> = Split<R, "/">[number];
type RouteParam<T extends string> = T extends `$${string}` ? T : never;
type RouteSplit<R extends Route> = RouteParam<RouteSegment<R>>;
type RouteParams<R extends Route> = {
	[T in RouteSplit<R>]: string;
};

interface Options<R extends Route = Route>
	extends Omit<RenderOptions, "queries"> {
	preloadedState?: Partial<RootState>;
	store?: AppStore;
	route?: R;
	params?: RouteParams<R>;
	user?: User;
}

export function renderApp<R extends Route = Route>(options: Options<R>) {
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
		params,
		...renderOptions
	} = options;
	const history = createMemoryHistory({
		initialEntries: [
			params
				? route
						.split("/")
						.map((segment) => params[segment as RouteSplit<R>] ?? segment)
						.join("/")
				: route,
		],
	});
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
