import { Link } from "@tanstack/react-router"
import clsx from "clsx"
import type { LucideIcon } from "lucide-react"
import type React from "react"
import type { ComponentProps } from "react"

import type { Router } from "@/shared/router"

type LinkProps = ComponentProps<typeof Link<Router>> & { type: "link" }
type ButtonProps = ComponentProps<"button"> & { type: "button" }
type Props = (ButtonProps | LinkProps) & {
	Icon: LucideIcon
}
const className =
	"inline-flex items-center border-b-2 h-full px-1 pt-1 text-sm font-medium "
const inactiveClassName =
	"border-transparent  text-gray-500 hover:border-gray-300 hover:text-gray-700"
export const NavbarItem: React.FC<Props> = ({ Icon, ...props }) => {
	const StylizedIcon = <Icon className="text-primary-foreground size-11" />

	if (props.type === "button") {
		return (
			<button
				{...props}
				className={clsx(inactiveClassName, className, props.className)}
			>
				{StylizedIcon}
			</button>
		)
	}
	return (
		<Link
			{...props}
			activeProps={{
				className: "border-transparent hover:border-gray-300 text-gray-900"
			}}
			inactiveProps={{
				className: inactiveClassName
			}}
			className={clsx(props.className, className)}
		>
			{StylizedIcon}
		</Link>
	)
}
