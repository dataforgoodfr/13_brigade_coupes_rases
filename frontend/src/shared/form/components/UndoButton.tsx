import { Undo2 } from "lucide-react"

import {
	IconButton,
	type IconButtonProps
} from "@/shared/components/button/Button"

type Props = Omit<IconButtonProps, "icon">
export function UndoButton({ ...props }: Props) {
	return (
		<IconButton
			{...props}
			type={props.type ?? "button"}
			variant={props.variant ?? "ghost"}
			size={props.size ?? "icon"}
			className={props.className ?? "text-primary"}
			title={props.title ?? "Revenir à la valeur initiale"}
			icon={<Undo2 />}
		/>
	)
}
