import { DotByStatus } from "@/features/clear-cut/components/DotByStatus"
import type { ClearCutStatus } from "@/features/clear-cut/store/clear-cuts"
import { CLEAR_CUTTING_STATUS_TRANSLATIONS } from "@/features/clear-cut/store/status"

interface Props {
	status: ClearCutStatus
}
export function StatusWithLabel({ status }: Props) {
	return (
		<div className="flex items-center gap-2">
			<DotByStatus status={status} />
			{CLEAR_CUTTING_STATUS_TRANSLATIONS[status]}
		</div>
	)
}
