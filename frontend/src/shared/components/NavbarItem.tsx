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
	"inline-flex items-center justify-center rounded-xl p-2 text-primary-foreground transition-colors"
const inactiveClassName = "opacity-60 hover:opacity-100 hover:bg-white/10"
const activeClassName = "opacity-100 bg-white/20"
export const NavbarItem: React.FC<Props> = ({ Icon, ...props }) => {
	const StylizedIcon = <Icon className="size-9" />

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
				className: activeClassName
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
