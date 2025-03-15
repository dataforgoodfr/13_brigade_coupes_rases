import { within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

type Options = { user: UserEvent; container: HTMLElement; title: string };
export function clearCuttingItem({ container, title, user }: Options) {
	const getTitle = () => within(container).getByText(title);
	const itemContainer = getTitle().parentElement?.parentElement;
	return {
		reportDate: getTitle().nextElementSibling?.textContent,
		status: itemContainer?.children.item(1)?.children.item(1)?.textContent,
		comment: itemContainer?.children.item(2)?.textContent,
	};
}
