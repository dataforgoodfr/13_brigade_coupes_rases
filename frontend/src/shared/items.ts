export interface SelectableItem<T> {
	isSelected: boolean;
	item: T;
}

export function toSelectableItems<T>(items?: T[]): SelectableItem<T>[] {
	return items?.map((item) => ({ isSelected: false, item })) ?? [];
}
