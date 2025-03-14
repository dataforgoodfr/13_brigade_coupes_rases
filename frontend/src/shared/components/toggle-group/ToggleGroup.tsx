import {
	ToggleGroup as ShadcnToggleGroup,
	ToggleGroupItem,
	type ToggleGroupItemProps,
	type ToggleGroupProps,
} from "@/components/ui/toggle-group";
import type { SelectableItemEnhanced } from "@/shared/items";

export type ToggleGroupInputProps<TItem> = Omit<
	ToggleGroupProps<string>,
	"value" | "onValueChange"
> & {
	value: readonly SelectableItemEnhanced<TItem>[];
	itemProps?: Omit<ToggleGroupItemProps, "value" | "children">;
} & (
		| {
				type: "multiple";
				onValueChange: (items: SelectableItemEnhanced<TItem>[]) => void;
		  }
		| {
				type: "single";
				allowEmptyValue?: boolean;

				onValueChange: (item?: SelectableItemEnhanced<TItem>) => void;
		  }
	);
export function ToggleGroup<TItem>({
	className,
	children,
	value: items,
	itemProps,
	...props
}: ToggleGroupInputProps<TItem>) {
	const Items = items.map(({ value, label }) => (
		<ToggleGroupItem key={value} value={value} {...itemProps}>
			{label}
		</ToggleGroupItem>
	));
	if (props.type === "multiple") {
		const value = items
			.filter(({ isSelected }) => isSelected)
			.map(({ value }) => value);
		return (
			<ShadcnToggleGroup
				{...props}
				type={"multiple"}
				value={value}
				defaultValue={value}
				onValueChange={(selectedValues) =>
					props.onValueChange(
						items.map((item) =>
							selectedValues.includes(item.value)
								? { ...item, isSelected: true }
								: { ...item, isSelected: false },
						),
					)
				}
			>
				{Items}
			</ShadcnToggleGroup>
		);
	}
	const value = items.find(({ isSelected }) => isSelected)?.value;
	return (
		<ShadcnToggleGroup
			{...props}
			type="single"
			defaultValue={value}
			value={props.allowEmptyValue ? undefined : value}
			onValueChange={(v) => {
				if (!v && !props.allowEmptyValue) {
					return;
				}
				const item = items.find((item) => item.value === v);
				props.onValueChange(
					item === undefined
						? undefined
						: { ...item, isSelected: !item.isSelected },
				);
			}}
		>
			{Items}
		</ShadcnToggleGroup>
	);
}
