import { Dot } from "@/shared/components/Dot";
import clsx from "clsx";
import {
	CLEAR_CUTTING_STATUS_BACKGROUND_COLORS,
	type ClearCuttingStatus,
} from "../store/status";

interface Props {
	className?: string;
	status: ClearCuttingStatus;
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
