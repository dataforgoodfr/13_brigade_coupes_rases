import { Link } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"
import type { ComponentProps } from "react"

import type { Router } from "@/shared/router"

interface Props extends ComponentProps<typeof Link<Router>> {
	Icon: LucideIcon
	label: string
	forceActive?: boolean
}

const ACTIVE_PROPS = {
	className: "text-primary"
}
const INACTIVE_PROPS = {
	className: "text-gray-500 hover:border-gray-300 hover:text-gray-700"
}

export const MobileNavbarLink: React.FC<Props> = ({
	Icon,
	label,
	forceActive,
	...props
}) => {
	let activeProps = ACTIVE_PROPS
	let inactiveProps = INACTIVE_PROPS

	if (forceActive !== undefined) {
		activeProps = forceActive ? ACTIVE_PROPS : INACTIVE_PROPS
		inactiveProps = forceActive ? ACTIVE_PROPS : INACTIVE_PROPS
	}

	return (
		<Link
			activeProps={activeProps}
			inactiveProps={inactiveProps}
			className="flex flex-col items-center h-full px-1 pt-1 text-xs font-medium "
			{...props}
		>
			<Icon className="size-7 " />
			{label}
		</Link>
	)
}
