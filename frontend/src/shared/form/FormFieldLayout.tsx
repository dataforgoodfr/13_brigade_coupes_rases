import clsx from "clsx";
import { RefreshCcwDotIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { FieldValues, Path } from "react-hook-form";
import { IconButton } from "@/shared/components/button/Button";
import { useHasChanged } from "@/shared/form/hooks";
import type { Align, Orientation } from "@/shared/layout";
import { FormControl, FormItem, FormLabel, FormMessage } from "./Form";
import type { FormType } from "./types";

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
	form: FormType<Form>;
	originalForm?: Form;
	latestForm?: Form;
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
	form,
	originalForm,
}: Props<Form, Name>) {
	const hasChanged = useHasChanged({ original: originalForm, name, form });
	return (
		<FormItem
			className={clsx(`flex gap-${gap} items-${align}`, {
				"flex-col": orientation === "vertical",
			})}
		>
			{label && (
				<FormLabel className="font-bold min-w-2/8">
					{label}{" "}
					{hasChanged?.hasChanged && (
						<IconButton
							type="button"
							variant="ghost"
							className="text-primary"
							title="Revenir à la valeur initiale"
							onClick={() => {
								form.resetField(name, {
									defaultValue: hasChanged.originalValue,
								});
							}}
							icon={<RefreshCcwDotIcon />}
						/>
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
