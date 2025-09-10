import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { IntlProvider } from "react-intl";
import { Provider } from "react-redux";
import { App } from "@/App";
import "./index.css";
import { store } from "./shared/store/store";

async function enableMocking() {
	if (import.meta.env.MODE !== "mock") {
		return;
	}
	const { worker } = await import("./mocks/browser");
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
