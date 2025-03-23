import { DotByStatus } from "@/features/clear-cutting/components/DotByStatus";
import { CLEAR_CUTTING_STATUS_TRANSLATIONS } from "@/features/clear-cutting/store/status";
import type { ClearCuttingStatus } from "@/shared/store/referential/referential";

interface Props {
	status: ClearCuttingStatus;
}
export function StatusWithLabel({ status }: Props) {
	return (
		<div className="flex items-center gap-2">
			<DotByStatus status={status} />
			{CLEAR_CUTTING_STATUS_TRANSLATIONS[status]}
		</div>
	);
}
