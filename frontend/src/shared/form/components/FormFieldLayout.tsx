import clsx from "clsx";
import type { ReactNode } from "react";
import type { FieldValues, Path } from "react-hook-form";
import { DownloadOutdatedButton } from "@/shared/form/components/DownloadOutdatedButton";
import { UndoButton } from "@/shared/form/components/UndoButton";
import { useChangeTrackingFormContext } from "@/shared/form/context/ChangeTrackingForm";
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
}: Props<Form, Name>) {
	const { hasChanged, resetTrackedFieldFromOther } =
		useChangeTrackingFormContext<
			Form,
			Name,
			Record<"original" | "current" | "latest", Form>
		>();
	const changedFromOriginal = hasChanged(name, "original");
	const changedFromLatest = hasChanged(name, "latest");

	return (
		<FormItem
			className={clsx(`flex gap-${gap} items-${align}`, {
				"flex-col": orientation === "vertical",
			})}
		>
			{label && (
				<FormLabel className="font-bold min-w-2/8">
					{label}{" "}
					{changedFromOriginal?.hasChanged && (
						<UndoButton
							onClick={() => {
								resetTrackedFieldFromOther(name, "original");
							}}
						/>
					)}{" "}
					{changedFromLatest?.hasChanged && (
						<DownloadOutdatedButton
							onClick={() => {
								resetTrackedFieldFromOther(name, "latest");
							}}
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
