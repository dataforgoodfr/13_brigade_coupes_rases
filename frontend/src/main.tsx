import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { IntlProvider } from "react-intl"
import { Provider } from "react-redux"

import { App } from "@/App"
// Styles et polices servis par l'application (précachés par le service worker)
// pour que la carte garde sa mise en page hors connexion.
import "leaflet/dist/leaflet.css"
import "@fontsource-variable/inter/wght.css"
import "@fontsource-variable/manrope/wght.css"
import "@fontsource-variable/plus-jakarta-sans/wght.css"
import "@fontsource-variable/roboto/wght.css"
import "@fontsource-variable/roboto/wght-italic.css"
import "@fontsource/poppins/latin-300.css"
import "@fontsource/poppins/latin-400.css"
import "@fontsource/poppins/latin-500.css"
import "@fontsource/poppins/latin-600.css"
import "@fontsource/poppins/latin-700.css"
import "./index.css"

import { store } from "./shared/store/store"

async function enableMocking() {
	const isDemo = import.meta.env.VITE_DEMO === "true"
	if (import.meta.env.MODE !== "mock" && !isDemo) {
		return
	}
	if (isDemo) {
		// The same fake data on every visit, seeded before the mocks build it
		const { faker, fakerFR } = await import("@faker-js/faker")
		faker.seed(13)
		fakerFR.seed(13)
	}
	const { worker } = await import("./mocks/browser")
	return worker.start({
		serviceWorker: {
			url: `${import.meta.env.BASE_URL}mockServiceWorker.js`
		}
	})
}

enableMocking().then(() => {
	createRoot(document.getElementById("root") as HTMLElement).render(
		<StrictMode>
			<IntlProvider locale={"fr"} messages={{}}>
				<Provider store={store}>
					<App />
				</Provider>
			</IntlProvider>
		</StrictMode>
	)
})
