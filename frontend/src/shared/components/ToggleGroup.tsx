import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import {
	type ToggleVariantsProps,
	toggleVariants,
} from "@/shared/components/Toggle";
import { type ComponentProps, createContext, useContext } from "react";

const ToggleGroupContext = createContext<ToggleVariantsProps>({
	size: "default",
	variant: "default",
});
export type ToggleGroupProps = ComponentProps<
	typeof ToggleGroupPrimitive.Root
> &
	ToggleVariantsProps;
export function ToggleGroup({
	className,
	variant,
	size,
	children,
	...props
}: ToggleGroupProps) {
	return (
		<ToggleGroupPrimitive.Root
			data-slot="toggle-group"
			data-variant={variant}
			data-size={size}
			className={cn(
				"group/toggle-group flex items-center rounded-md data-[variant=outline]:shadow-xs",
				className,
			)}
			{...props}
		>
			<ToggleGroupContext.Provider value={{ variant, size }}>
				{children}
			</ToggleGroupContext.Provider>
		</ToggleGroupPrimitive.Root>
	);
}

export function ToggleGroupItem({
	className,
	children,
	variant,
	size,
	...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item> &
	VariantProps<typeof toggleVariants>) {
	const context = useContext(ToggleGroupContext);

	return (
		<ToggleGroupPrimitive.Item
			data-slot="toggle-group-item"
			data-variant={context.variant || variant}
			data-size={context.size || size}
			className={cn(
				toggleVariants({
					variant: context.variant || variant,
					size: context.size || size,
				}),
				"min-w-0 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l",
				className,
			)}
			{...props}
		>
			{children}
		</ToggleGroupPrimitive.Item>
	);
}
