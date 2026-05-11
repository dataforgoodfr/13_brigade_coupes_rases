import clsx from "clsx"

export interface DotProps {
	className?: string
	color?: "green" | "red" | "yellow" | "gray"
}
export function Dot({ className, color }: DotProps) {
	return (
		<div
			className={clsx(className, "rounded-full w-2 h-2", {
				"bg-green-500": color === "green",
				"bg-red-500": color === "red",
				"bg-yellow-500": color === "yellow",
				"bg-gray-400": color === "gray"
			})}
		/>
	)
}
