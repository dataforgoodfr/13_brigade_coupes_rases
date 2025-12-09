import { screen, type waitForOptions } from "@testing-library/react"
import type { UserEvent } from "@vitest/browser/context"

import { clearCutItem } from "@/test/page-object/clear-cuts-item"

type Options = { user: UserEvent } & waitForOptions
export function clearCuts({ user, ...options }: Options) {
	const findTitle = () => screen.findByText("COUPES RASES", undefined, options)
	const findContainer = async () =>
		(await findTitle()).parentElement?.parentElement?.nextElementSibling
			?.firstChild as HTMLElement
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
