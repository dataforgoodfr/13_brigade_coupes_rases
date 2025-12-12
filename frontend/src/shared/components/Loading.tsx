import type React from "react"

import { cn } from "@/lib/utils"

interface LoadingProps {
	className?: React.HTMLAttributes<HTMLDivElement>["className"]
}

export const Loading = ({ className }: LoadingProps) => {
	return (
		<div className={cn("h-1 w-full bg-zinc-200/50 overflow-hidden", className)}>
			<div className="progress w-full h-full bg-primary left-right"></div>
		</div>
	)
}
