import { App } from "@/App";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { IntlProvider } from "react-intl";
import { Provider } from "react-redux";
import "./index.css";
import { store } from "./shared/store/store";
async function enableMocking() {
	if (
		import.meta.env.MODE !== "development" ||
		import.meta.env.VITE_MOCK === "false"
	) {
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
			<IntlProvider locale={"fr"} messages={{}}>
				<Provider store={store}>
					<App />
				</Provider>
			</IntlProvider>
		</StrictMode>,
	);
});
