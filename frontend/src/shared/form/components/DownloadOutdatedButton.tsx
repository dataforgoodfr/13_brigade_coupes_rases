import { CloudDownload } from "lucide-react"

import {
	IconButton,
	type IconButtonProps
} from "@/shared/components/button/Button"

type Props = Omit<IconButtonProps, "icon">

export function DownloadOutdatedButton(props: Props) {
	return (
		<IconButton
			{...props}
			type={props.type ?? "button"}
			variant={props.variant ?? "ghost"}
			size={props.size ?? "icon"}
			className={props.className ?? "text-warning p-0"}
			title={props.title ?? "Utiliser la dernière valeur"}
			icon={<CloudDownload />}
		/>
	)
}
