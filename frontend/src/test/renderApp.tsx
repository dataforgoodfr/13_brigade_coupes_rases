import { type Routes as Route, router } from "@/shared/router";
import {
	type AppStore,
	type RootState,
	setupStore,
} from "@/shared/store/store";
import { RouterProvider } from "@tanstack/react-router";
import { type RenderOptions, render } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { Provider } from "react-redux";
interface Options extends Omit<RenderOptions, "queries"> {
	preloadedState?: Partial<RootState>;
	store?: AppStore;
	route?: Route;
}

export async function renderApp(options: Options) {
	const {
		preloadedState = {},
		// Automatically create a store instance if no store was passed in
		store = setupStore(preloadedState),
		...renderOptions
	} = options;
	await router.navigate({ to: options.route ?? "/" });
	const Wrapper = () => (
		<Provider store={store}>
			<RouterProvider router={router} />
		</Provider>
	);
	return {
		...render(<Wrapper />, renderOptions),
		user: userEvent.setup(),
	};
}
