import { router } from "@/shared/router";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import "./index.css";
import { store } from "./shared/store/store";
async function enableMocking() {
	if (import.meta.env.MODE !== "development") {
		return;
	}

	const { worker } = await import("./mocks/browser");

	// `worker.start()` returns a Promise that resolves
	// once the Service Worker is up and ready to intercept requests.
	return worker.start();
}

enableMocking().then(() => {
	createRoot(document.getElementById("root") as HTMLElement).render(
		<StrictMode>
			<Provider store={store}>
				<RouterProvider router={router} />
			</Provider>
		</StrictMode>,
	);
});
