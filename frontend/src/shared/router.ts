import { type FileRoutesByTo, routeTree } from "@/routeTree.gen";
import { createRouter } from "@tanstack/react-router";

export type Routes = keyof FileRoutesByTo;
// Create a new router instance
export const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
