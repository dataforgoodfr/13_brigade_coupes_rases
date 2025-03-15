import { clearCuttingItem } from "@/test/page-object/clear-cutting-item";
import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

type Options = { user: UserEvent };
export async function clearCuttings({ user }: Options) {
	const title = await screen.findByText("COUPES RASES");
	const list = title.parentElement?.parentElement?.nextElementSibling
		?.firstChild as HTMLElement;
	return {
		filters: {},
		list: {
			count: list.childElementCount,
			item: (title: string) =>
				clearCuttingItem({ user, container: list, title }),
		},
	};
}
