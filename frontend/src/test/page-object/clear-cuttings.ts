import { clearCuttingItem } from "@/test/page-object/clear-cutting-item";
import { screen, type waitForOptions } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

type Options = { user: UserEvent } & waitForOptions;
export function clearCuttings({ user, ...options }: Options) {
	const findTitle = () => screen.findByText("COUPES RASES", undefined, options);
	const findContainer = async () =>
		(await findTitle()).parentElement?.parentElement?.nextElementSibling
			?.firstChild as HTMLElement;
	return {
		filters: {},
		list: {
			count: async () => (await findContainer()).childElementCount,
			item: (title: string) =>
				clearCuttingItem({
					user,
					findContainer: findContainer,
					title,
					...options,
				}),
		},
	};
}
