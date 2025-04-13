import type { ClearCutStatus } from "@/features/clear-cut/store/clear-cuts";
import { Dot } from "@/shared/components/Dot";
import clsx from "clsx";
import { CLEAR_CUTTING_STATUS_BACKGROUND_COLORS } from "../store/status";

interface Props {
	className?: string;
	status: ClearCutStatus;
}
export function DotByStatus({ status, className }: Props) {
	return (
		<Dot
			className={clsx(
				className,
				"h-3 w-3",
				CLEAR_CUTTING_STATUS_BACKGROUND_COLORS[status],
			)}
		/>
	);
}
