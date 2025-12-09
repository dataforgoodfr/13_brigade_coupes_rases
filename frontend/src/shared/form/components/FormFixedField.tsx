import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type FixedFieldProps = {
	title?: string
	value?: ReactNode
	className?: string
}

export function FixedField({ title, value, className }: FixedFieldProps) {
	return value !== undefined ? (
		<div className={cn("flex gap-2", className)}>
			{title && <span className="font-bold">{title} :</span>}
			{value && <p>{value}</p>}
		</div>
	) : undefined
}
