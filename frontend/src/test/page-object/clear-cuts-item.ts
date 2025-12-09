import { type waitForOptions, within } from "@testing-library/react"
import type { UserEvent } from "@vitest/browser/context"

type Options = {
	user: UserEvent
	findContainer: () => Promise<HTMLElement>
	title: string
} & waitForOptions

export async function clearCutItem({
	findContainer,
	title,
	...options
}: Options) {
	const findTitle = async () =>
		within(await findContainer()).findByText(title, undefined, options)
	const itemContainer = (await findTitle()).parentElement?.parentElement
	return {
		reportDate: (await findTitle()).nextElementSibling?.textContent,
		status: itemContainer?.children.item(1)?.children.item(1)?.textContent,
		comment: itemContainer?.children.item(2)?.textContent
	}
}
