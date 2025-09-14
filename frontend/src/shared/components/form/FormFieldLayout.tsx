import clsx from "clsx";
import { RefreshCcwDotIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
	type Control,
	type FieldValues,
	type Path,
	useController,
} from "react-hook-form";
import { IconButton } from "@/shared/components/button/Button";
import type { Align, Orientation } from "@/shared/layout";
import { FormControl, FormItem, FormLabel, FormMessage } from "./Form";

export type Props<
	Form extends FieldValues,
	Name extends Path<Form> = Path<Form>,
> = {
	label?: string;
	children: ReactNode;
	orientation?: Orientation;
	withControl?: boolean;
	align?: Align;
	gap?: number;
	control: Control<Form>;
	name: Name;
};

export type FormFieldLayoutProps<
	Form extends FieldValues,
	Name extends Path<Form> = Path<Form>,
> = Omit<Props<Form, Name>, "children">;
export function FormFieldLayout<
	Form extends FieldValues,
	Name extends Path<Form>,
>({
	label,
	children,
	gap = 2,
	align = "center",
	orientation = "horizontal",
	withControl = true,
	name,
	control,
}: Props<Form, Name>) {
	const fieldController = useController({ name, control });
	return (
		<FormItem
			className={clsx(`flex gap-${gap} items-${align}`, {
				"flex-col": orientation === "vertical",
			})}
		>
			{label && (
				<FormLabel className="font-bold min-w-2/8">
					{label}{" "}
					{fieldController.fieldState.isDirty && (
						<IconButton variant="ghost" icon={<RefreshCcwDotIcon />} />
					)}
				</FormLabel>
			)}
			<div className="flex flex-grow-1 flex-col">
				{withControl ? <FormControl>{children}</FormControl> : children}
				<FormMessage />
			</div>
		</FormItem>
	);
}
