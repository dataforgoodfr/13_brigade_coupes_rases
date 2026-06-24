import { screen, within } from "@testing-library/react"
import type { UserEvent } from "@vitest/browser/context"

type Options = { user: UserEvent }
type SwitchLabel = "Favoris" | "Zone protégée" | "Pente excessive"
export function advancedFilters({ user }: Options) {
	return {
		open: async () => {
			// The label text is hidden on narrow viewports; target the button by its
			// accessible name (from the title attribute) so it works at any width.
			await user.click(await screen.findByRole("button", { name: "Filtres" }))
		},
		favorite: toggleInput({ user, label: "Favoris" }),
		excessive_slop: toggleInput({ user, label: "Pente excessive" }),
		ecological_zoning: toggleInput({ user, label: "Zone protégée" })
	}
}
type SwitchOptions = Options & { label: SwitchLabel }

function toggleInput({ user, label }: SwitchOptions) {
	return {
		toggle: async (value: boolean | undefined) => {
			const labelElement = await screen.findByText(label)
			// The label and its toggle group share a parent wrapper; scope the
			// option lookup there (robust whether filters render inline or in a sheet).
			const group = (labelElement.parentElement ??
				labelElement.nextElementSibling) as HTMLElement
			const button = await within(group).findByText(
				value === true ? "Oui" : value === false ? "Non" : "Tout"
			)
			await user.click(button)
		}
	}
}
