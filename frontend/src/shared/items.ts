export interface NamedId {
	id: string;
	name: string;
}
export interface SelectableItem<T> {
	isSelected: boolean;
	item: T;
}

export function listToSelectableItems<T>(items?: T[]): SelectableItem<T>[] {
	return items?.map((item) => ({ isSelected: false, item })) ?? [];
}

export function recordToSelectableItems<T>(
	items?: Record<string, T>,
): SelectableItem<T>[] {
	return items === undefined
		? []
		: Object.entries(items).map(([, item]) => ({ isSelected: false, item }));
}

export function recordToSelectableItemsTransformed<TItem, TTransformed = TItem>(
	items: Record<string, TItem>,
	transform: (key: string, item: TItem) => TTransformed,
): SelectableItem<TTransformed>[] {
	return items === undefined
		? []
		: Object.entries(items).map(([key, item]) => ({
				isSelected: false,
				item: transform(key, item),
			}));
}

export function recordToNamedId(record?: Record<string, string>): NamedId[] {
	return record === undefined
		? []
		: Object.entries(record).map(([k, v]) => ({ id: k, name: v }));
}
