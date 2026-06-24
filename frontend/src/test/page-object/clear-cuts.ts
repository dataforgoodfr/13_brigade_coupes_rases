import { screen, type waitForOptions } from "@testing-library/react"
import type { UserEvent } from "@vitest/browser/context"

import { clearCutItem } from "@/test/page-object/clear-cuts-item"

type Options = { user: UserEvent } & waitForOptions
export function clearCuts({ user, ...options }: Options) {
	const findTitle = () => screen.findByText("COUPES RASES", undefined, options)
	// Wait for the list header, then grab the list itself by role. This is robust
	// to header layout changes (inline collapsible vs. portal sheet for filters).
	// `hidden: true` is needed because an open filter sheet marks the rest of the
	// page as aria-hidden for focus trapping.
	const findContainer = async () => {
		await findTitle()
		return screen.findByRole(
			"list",
			{ name: "Liste des coupes rases", hidden: true },
			options
		)
	}
	return {
		filters: {},
		list: {
			count: async () => (await findContainer()).childElementCount,
			item: (title: string) =>
				clearCutItem({
					user,
					findContainer: findContainer,
					title,
					...options
				})
		}
	}
}
