import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { page, userEvent } from "@vitest/browser/context";
import { IntlProvider } from "react-intl";
import { Provider } from "react-redux";
import { type ComponentRenderOptions, render } from "vitest-browser-react";
import { MapProvider } from "@/features/clear-cut/components/map/Map.context";
import {
	type AuthContext,
	AuthProvider,
	useAuth,
} from "@/features/user/components/Auth.context";
import type { Me } from "@/features/user/store/me";
import { routeTree } from "@/routeTree.gen";
import type { Routes as Route } from "@/shared/router";
import {
	type AppStore,
	type RootState,
	setupStore,
} from "@/shared/store/store";

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
	extends Omit<ComponentRenderOptions, "queries"> {
	preloadedState?: Partial<RootState>;
	store?: AppStore;
	route?: R;
	params?: RouteParams<R>;
	user?: Me;
}

export function renderApp<R extends Route = Route>(options: Options<R>) {
	localStorage.clear();
	const {
		preloadedState = {},
		// Automatically create a store instance if no store was passed in
		store = setupStore({
			...preloadedState,
			me: {
				...(preloadedState.me as RootState["me"]),
				me: options.user
					? { status: "success", value: options.user }
					: (preloadedState.me?.me as RootState["me"]["me"]),
			},
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
		<IntlProvider locale="fr">
			<Provider store={store}>
				<TestApp />
			</Provider>
		</IntlProvider>
	);
	return {
		...render(<Wrapper />, renderOptions),
		store,
		page,
		router,
		user: userEvent.setup(),
	};
}
