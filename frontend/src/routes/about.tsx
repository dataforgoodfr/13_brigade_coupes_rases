import { createFileRoute } from "@tanstack/react-router"

import { About } from "@/shared/components/About"

export const Route = createFileRoute("/about")({
	component: About
})
