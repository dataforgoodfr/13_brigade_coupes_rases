import clsx from "clsx";
import type { ReactNode } from "react";
import type { Align, Orientation } from "@/shared/layout";
import { FormControl, FormItem, FormLabel, FormMessage } from "./Form";

export type Props = {
	label?: string;
	children: ReactNode;
	orientation?: Orientation;
	withControl?: boolean;
	align?: Align;
};

export type FormFieldLayoutProps = Omit<Props, "children">;
export function FormFieldLayout({
	label,
	children,
	align = "center",
	orientation = "horizontal",
	withControl = true,
}: Props) {
	return (
		<FormItem
			className={clsx(`flex gap-4 items-${align}`, {
				"flex-col": orientation === "vertical",
			})}
		>
			{label && <FormLabel className="font-bold min-w-2/8">{label}</FormLabel>}
			<div className="flex flex-grow-1 flex-col">
				{withControl ? <FormControl>{children}</FormControl> : children}
				<FormMessage />
			</div>
		</FormItem>
	);
}
