import { screen, within } from "@testing-library/react"
import type { UserEvent } from "@vitest/browser/context"

type Options = { user: UserEvent }
type SwitchLabel = "Favoris" | "Zone protégée" | "Pente excessive"
export function advancedFilters({ user }: Options) {
	return {
		open: async () => {
			await user.click(await screen.findByText("Filtres"))
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
			const button = await within(
				labelElement.nextElementSibling as HTMLElement
			).findByText(value === true ? "Oui" : value === false ? "Non" : "Tout")
			await user.click(button)
		}
	}
}
