import type { SelectableItem } from "@/shared/items";
import clsx from "clsx";

interface Props<T> {
	id: string;
	items: readonly SelectableItem<T>[];
	onClick: (item: T) => void;
	getLabel: (item: T) => string;
}
export function ButtonGroup<T>({ items, onClick, getLabel, id }: Props<T>) {
	return (
		<span className="inline-flex rounded-md shadow-sm" id={id}>
			{items.map((item) => (
				<button
					key={getLabel(item.item)}
					type="button"
					onClick={() => onClick(item.item)}
					className={clsx(
						"relative inline-flex items-center rounded-l-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10",
					)}
				>
					{getLabel(item.item)}
				</button>
			))}
		</span>
	);
}
