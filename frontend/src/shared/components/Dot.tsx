import clsx from "clsx"

export interface DotProps {
	className?: string
}
export function Dot({ className }: DotProps) {
	return <div className={clsx(className, "rounded-full")} />
}
