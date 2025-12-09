import { Check } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import type { ButtonProps } from "@/components/ui/button"
import {
	Command,
	CommandEmpty,
	type CommandEmptyProps,
	CommandGroup,
	CommandInput,
	type CommandInputProps,
	CommandItem,
	CommandList
} from "@/components/ui/command"
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { ExpandButton } from "@/shared/components/button/ExpandButton"
import { ResetButton } from "@/shared/components/button/ResetButton"
import type { SelectableItemEnhanced } from "@/shared/items"

export type SingleSelectComboboxProps<TItem> = {
	type: "single"
	onChanged?: (item: SelectableItemEnhanced<TItem>) => void
}
export type MultiSelectComboboxProps<TItem> = {
	type: "multiple"
	onChanged?: (item: SelectableItemEnhanced<TItem>[]) => void
}

export type ComboboxProps<TItem> = {
	hasReset?: boolean
	countPreview?: boolean
	id?: string
	changeOnClose?: (items: SelectableItemEnhanced<TItem>[]) => void
	commandInputProps?: Omit<CommandInputProps, "children">
	commandEmptyProps?: CommandEmptyProps
	buttonProps?: ButtonProps
	items?: SelectableItemEnhanced<TItem>[]
	closeAfterToggle?: boolean
} & (SingleSelectComboboxProps<TItem> | MultiSelectComboboxProps<TItem>)

const EMPTY_ARRAY: unknown[] = []
export function Combobox<TItem>({
	items = EMPTY_ARRAY as SelectableItemEnhanced<TItem>[],
	buttonProps,
	commandInputProps,
	commandEmptyProps,
	changeOnClose,
	countPreview = false,
	hasReset = false,
	closeAfterToggle = false,
	id,
	...props
}: ComboboxProps<TItem>) {
	const [open, setOpen] = useState(false)
	const [localItems, setLocalItems] = useState(items)
	useEffect(() => setLocalItems(items), [items])
	const selectedItemsCount = useMemo(
		() =>
			localItems.reduce((acc, item) => (item.isSelected ? acc + 1 : acc), 0),
		[localItems]
	)

	const toggle = (item: SelectableItemEnhanced<TItem>) => {
		if (props.type === "single") {
			if (changeOnClose) {
				props.onChanged?.({ ...item, isSelected: !item.isSelected })
			} else {
				setLocalItems(
					localItems.map((localItem) =>
						localItem.value === item.value
							? { ...item, isSelected: !item.isSelected }
							: item
					)
				)
			}
		}
		if (props.type === "multiple") {
			const changedItems = localItems.map((i) =>
				i.value === item.value ? { ...i, isSelected: !i.isSelected } : { ...i }
			)
			if (changeOnClose) {
				setLocalItems(changedItems)
			} else {
				props.onChanged?.(changedItems)
			}
		}
	}
	const reset = () => {
		const unselectedItem = items.map((item) => ({
			...item,
			isSelected: false
		}))
		if (props.type === "single") {
			const selectedItem = items.find((item) => item.isSelected)
			if (selectedItem) {
				if (changeOnClose) {
					setLocalItems(unselectedItem)
				} else {
					props.onChanged?.({ ...selectedItem, isSelected: false })
				}
			}
		}
		if (props.type === "multiple") {
			if (changeOnClose) {
				setLocalItems(unselectedItem)
			} else {
				props.onChanged?.(unselectedItem)
			}
		}
	}
	const close = () => {
		setOpen(false)
		changeOnClose?.(localItems)
	}
	const handleOpenChanged = (isOpen: boolean) => {
		setOpen(isOpen)
		if (!isOpen) {
			changeOnClose?.(localItems)
		}
	}
	return (
		<Popover open={open} onOpenChange={handleOpenChanged}>
			<PopoverTrigger asChild id={id}>
				<ExpandButton open={open} {...buttonProps}>
					{buttonProps?.children}{" "}
					{countPreview && selectedItemsCount > 0 && (
						<>({selectedItemsCount})</>
					)}
				</ExpandButton>
			</PopoverTrigger>

			<PopoverContent>
				<Command>
					{commandInputProps && <CommandInput {...commandInputProps} />}
					<CommandList>
						{commandEmptyProps && <CommandEmpty {...commandEmptyProps} />}
						<CommandGroup>
							{localItems.map((enhancedItem) => (
								<CommandItem
									key={enhancedItem.value}
									value={enhancedItem.value}
									onSelect={() => {
										toggle(enhancedItem)
										if (closeAfterToggle) {
											close()
										}
									}}
								>
									{enhancedItem.label}
									<Check
										className={cn(
											"ml-auto",
											enhancedItem.isSelected ? "opacity-100" : "opacity-0"
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
				{hasReset && (
					<ResetButton disabled={selectedItemsCount === 0} onClick={reset} />
				)}
			</PopoverContent>
		</Popover>
	)
}
