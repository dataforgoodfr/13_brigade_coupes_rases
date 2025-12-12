import { isUndefined } from "es-toolkit"
import type React from "react"
import { useId } from "react"
import type { Path } from "react-hook-form"

import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from "@/components/ui/accordion"
import type {
	ClearCutFormInput,
	ClearCutFormVersions
} from "@/features/clear-cut/store/clear-cuts"
import { cn } from "@/lib/utils"
import { DownloadOutdatedButton } from "@/shared/form/components/DownloadOutdatedButton"
import { UndoButton } from "@/shared/form/components/UndoButton"
import { useChangeTrackingFormContext } from "@/shared/form/context/ChangeTrackingForm"

type AccordionFullItemProps = {
	title: string
	children?: React.ReactNode
	className?: string
}

export function AccordionFullItem({
	title,
	children,
	className
}: AccordionFullItemProps) {
	const val = useId()
	const { changedFields, resetTrackedFieldsFromOther } =
		useChangeTrackingFormContext<
			ClearCutFormInput,
			Path<ClearCutFormInput>,
			Pick<ClearCutFormVersions, "original" | "latest">
		>()
	return (
		<AccordionItem value={val} className="border-b-0">
			<div className="flex items-center sticky top-0 bg-background z-10">
				{!isUndefined(changedFields.original) && changedFields.original > 0 && (
					<UndoButton
						onClick={() => {
							resetTrackedFieldsFromOther("original")
						}}
					>
						{changedFields.original}
					</UndoButton>
				)}
				{!isUndefined(changedFields.latest) && changedFields.latest > 0 && (
					<DownloadOutdatedButton
						onClick={() => {
							resetTrackedFieldsFromOther("latest")
						}}
					>
						{changedFields.latest}
					</DownloadOutdatedButton>
				)}
				<AccordionTrigger
					className="cursor-pointer ms-1 text-lg font-bold font-[Roboto] sticky top-0 py-3 border-b-1"
					headerClassName="grow"
				>
					{title}
				</AccordionTrigger>
			</div>

			<AccordionContent className={cn("font-[Roboto] pt-4", className)}>
				{children}
			</AccordionContent>
		</AccordionItem>
	)
}
