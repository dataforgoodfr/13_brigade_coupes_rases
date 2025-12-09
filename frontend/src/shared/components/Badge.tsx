import { XIcon } from "lucide-react"

import type { BadgeProps } from "@/components/ui/badge"
import { Badge as UIBadge } from "@/components/ui/badge"
import { IconButton } from "@/shared/components/button/Button"

type Props = BadgeProps & { onDismiss?: () => void }
export function Badge({ onDismiss, children, ...props }: Props) {
	return (
		<UIBadge {...props}>
			{!!onDismiss && (
				<IconButton
					variant="link"
					className="p-0"
					onClick={onDismiss}
					icon={<XIcon />}
				/>
			)}
			{children}
		</UIBadge>
	)
}
