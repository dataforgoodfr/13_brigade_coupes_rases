import { cn } from "@/lib/utils"

interface Props {
	durationMs: number
	className?: React.HTMLAttributes<HTMLDivElement>["className"]
}

export function TimeProgress({ durationMs, className }: Props) {
	return (
		<div className={cn("h-1 w-full bg-zinc-200/50 overflow-hidden", className)}>
			<div
				className="progress-time w-full h-full bg-primary left-right"
				style={
					{
						"--progress-time": `${durationMs / 1000}s`
					} as React.CSSProperties
				}
			></div>
		</div>
	)
}
