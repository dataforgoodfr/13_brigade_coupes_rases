import { setupWorker } from "msw/browser"

import { demoHandlers } from "./demo"
import { handlers } from "./handlers"

export const worker = setupWorker(
	...(import.meta.env.VITE_DEMO === "true" ? demoHandlers : []),
	...handlers
)
