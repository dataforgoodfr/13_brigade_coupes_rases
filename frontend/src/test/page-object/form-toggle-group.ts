import { screen } from "@testing-library/react";
import type { UserEvent } from "@vitest/browser/context";

type Options = { user: UserEvent; label: string };
export function formToggleGroup({ label }: Options) {
	const findButtons = async () => {
		const element = await screen.findByText(label);
		return Array.from(element.nextElementSibling?.children as HTMLCollection);
	};
	const isDisabled = async () => {
		const buttons = await findButtons();
		return buttons.every((b) => b.getAttribute("disabled") !== null);
	};
	return { isDisabled };
}
