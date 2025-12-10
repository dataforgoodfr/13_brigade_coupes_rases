import { Undo2 } from "lucide-react"

import { cn } from "@/lib/utils"
import {
	IconButton,
	type IconButtonProps
} from "@/shared/components/button/Button"

type Props = Omit<IconButtonProps, "icon">

export function UndoButton({
	type = "button",
	variant = "ghost",
	size = "icon",
	className,
	title = "Revenir à la valeur initiale",
	...rest
}: Props) {
	return (
		<IconButton
			type={type}
			variant={variant}
			size={size}
			className={cn("text-primary", className)}
			title={title}
			icon={<Undo2 />}
			{...rest}
		/>
	)
}
