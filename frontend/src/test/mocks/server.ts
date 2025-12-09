import { setupServer } from "msw/node"

import { handlers } from "@/mocks/handlers"

export const server = setupServer(...handlers)
server.events.on("request:start", ({ request }) => {
	// biome-ignore lint/suspicious/noConsole: Test purpose
	console.info(request.method, request.url)
})
