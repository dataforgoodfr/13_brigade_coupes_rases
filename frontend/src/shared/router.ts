import { createRouter } from "@tanstack/react-router"

import type { AuthContext } from "@/features/user/components/Auth.context"
import { type FileRoutesByTo, routeTree } from "@/routeTree.gen"

export type Routes = keyof FileRoutesByTo

// Create a new router instance
export const router = createRouter({
	routeTree,
	basepath: import.meta.env.BASE_URL,
	context: { auth: undefined as unknown as AuthContext }
})
export type Router = typeof router

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}
