import { handlers } from "@/mocks/handlers";
import { setupServer } from "msw/node";

export const server = setupServer(...handlers);
server.events.on("request:start", ({ request }) => {
	console.info(request.method, request.url);
});
