import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

type Options = { user: UserEvent };
type SwitchLabel = "Favoris" | "Zone protégée" | "Pente excessive";
export function advancedFilters({ user }: Options) {
	return {
		open: async () => {
			await user.click(await screen.findByText("Filtres"));
		},
		favorite: switchInput({ user, label: "Favoris" }),
		excessive_slop: switchInput({ user, label: "Pente excessive" }),
		ecological_zoning: switchInput({ user, label: "Zone protégée" }),
	};
}
type SwitchOptions = Options & { label: SwitchLabel };

function switchInput({ user, label }: SwitchOptions) {
	return {
		toggle: async () => {
			const button = await screen.findByLabelText(label);
			await user.click(button.firstChild as HTMLElement);
		},
	};
}
