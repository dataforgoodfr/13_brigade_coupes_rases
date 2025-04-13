import type { ReactNode } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export interface NamedId<
	TId extends string = string,
	TName extends string = string,
> {
	id: TId;
	name: TName;
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
export type SelectableItemEnhanced<T> = SelectableItem<T> & {
	prefix?: ReactNode;
	label: ReactNode;
	value: string;
};
export function recordToNamedId(record?: Record<string, string>): NamedId[] {
	return record === undefined
		? []
		: Object.entries(record).map(([k, v]) => ({ id: k, name: v }));
}

export const useEnhancedItems = <
	TItem,
	TLabel extends ReactNode,
	TValue extends string = string,
>(
	items: readonly SelectableItem<TItem>[],
	getItemLabel: (item: SelectableItem<TItem>) => TLabel,
	getItemValue: (item: SelectableItem<TItem>) => TValue,
): SelectableItemEnhanced<TItem>[] =>
	useMemo(
		() =>
			items.map((item) => ({
				...item,
				label: getItemLabel(item),
				value: getItemValue(item),
			})),
		[items, getItemLabel, getItemValue],
	);

export const useSingleSelect = <
	TItem,
	TSelectableItem extends SelectableItem<TItem>,
>(
	items: TSelectableItem[],
) => {
	const [singleItems, setSingleItems] = useState(items);

	const onChange = (item?: TSelectableItem) => {
		if (item === undefined) {
			setSingleItems(
				singleItems.map((singleItem) => ({ ...singleItem, isSelected: false })),
			);
		} else {
			setSingleItems(
				singleItems.map((singleItem) =>
					singleItem.item === item.item
						? item
						: { ...singleItem, isSelected: !item.isSelected },
				),
			);
		}
	};
	const selectedItem = singleItems.find((i) => i.isSelected);
	return [selectedItem, singleItems, onChange] as const;
};

export const selectableItemToString = <TItem>({
	item,
}: SelectableItem<TItem>) => JSON.stringify(item);
