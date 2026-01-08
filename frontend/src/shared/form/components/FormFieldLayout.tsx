import clsx from "clsx"
import type { ReactNode } from "react"
import type { FieldValues, Path } from "react-hook-form"

import { DownloadOutdatedButton } from "@/shared/form/components/DownloadOutdatedButton"
import { UndoButton } from "@/shared/form/components/UndoButton"
import { useChangeTrackingFormContext } from "@/shared/form/context/ChangeTrackingForm"
import type { Align, Orientation } from "@/shared/layout"

import { FormControl, FormItem, FormLabel, FormMessage } from "./Form"

export type Props<
	Form extends FieldValues,
	Name extends Path<Form> = Path<Form>
> = {
	label?: string
	children: ReactNode
	orientation?: Orientation
	withControl?: boolean
	align?: Align
	gap?: number
	name: Name
	disableChangeTracking?: boolean
}

export type FormFieldLayoutProps<
	Form extends FieldValues,
	Name extends Path<Form> = Path<Form>
> = Omit<Props<Form, Name>, "children">

export function FormFieldLayout<
	Form extends FieldValues,
	Name extends Path<Form>
>({
	label,
	children,
	gap = 2,
	align = "center",
	orientation = "horizontal",
	withControl = true,
	name,
	disableChangeTracking = false,
}: Props<Form, Name>) {
	const { hasChanged, resetTrackedFieldFromOther } = !disableChangeTracking ?
		useChangeTrackingFormContext<
			Form,
			Name,
			Record<"original" | "current" | "latest", Form>
		>() : { hasChanged: () => undefined, resetTrackedFieldFromOther: () => undefined }

	const changedFromOriginal = !disableChangeTracking ? hasChanged(name, "original") : undefined
	const changedFromLatest = !disableChangeTracking ? hasChanged(name, "latest") : undefined

	return (
		<FormItem
			className={clsx(`flex gap-${gap} items-${align}`, {
				"flex-col": orientation === "vertical"
			})}
		>
			{label && (
				<div className="flex items-center justify-start min-w-2/8 min-h-6.5">
					<FormLabel className="font-bold">{label}</FormLabel>
					{changedFromOriginal?.hasChanged && (
						<div className="relative">
							<UndoButton
								onClick={() => {
									resetTrackedFieldFromOther(name, "original")
								}}
								className="overflow-visible"
								size="xs"
							/>
						</div>
					)}{" "}
					{changedFromLatest?.hasChanged && (
						<DownloadOutdatedButton
							onClick={() => {
								resetTrackedFieldFromOther(name, "latest")
							}}
						/>
					)}
				</div>
			)}
			<div className="flex flex-grow-1 flex-col">
				{withControl ? <FormControl>{children}</FormControl> : children}
				<FormMessage />
			</div>
		</FormItem>
	)
}
