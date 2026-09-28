import { CloudDownload } from "lucide-react"

import { cn } from "@/lib/utils"
import {
	IconButton,
	type IconButtonProps
} from "@/shared/components/button/Button"
import { TOUCH_TARGET } from "@/shared/form/components/touchTarget"

type Props = Omit<IconButtonProps, "icon">

export function DownloadOutdatedButton(props: Props) {
	return (
		<IconButton
			{...props}
			type={props.type ?? "button"}
			variant={props.variant ?? "ghost"}
			size={props.size ?? "icon"}
			className={cn(TOUCH_TARGET, props.className ?? "text-warning p-0")}
			title={props.title ?? "Utiliser la dernière valeur"}
			icon={<CloudDownload />}
		/>
	)
}
