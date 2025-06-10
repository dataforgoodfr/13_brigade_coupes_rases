import { RuleBadge } from "@/features/clear-cut/components/RuleBadge";
import { StatusWithLabel } from "@/features/clear-cut/components/StatusWithLabel";
import { useMapInstance } from "@/features/clear-cut/components/map/Map.context";
import { useNavigateToClearCut } from "@/features/clear-cut/hooks";
import type { ClearCutReport } from "@/features/clear-cut/store/clear-cuts";
import { useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { FormattedDate } from "react-intl";

export function ClearCutItem({
	id,
	created_at,
	status,
	comment,
	rules: tags,
	city,
}: ClearCutReport) {
	const handleCardClick = useNavigateToClearCut(id)
	const { focusedClearCutId, setFocusedClearCutId } = useMapInstance();


	return (
		<li
			onClick={handleCardClick}
			onMouseEnter={() => setFocusedClearCutId(id)}
			onMouseLeave={() => setFocusedClearCutId(undefined)}
			onKeyUp={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					handleCardClick();
				}
			}}
			className={clsx("p-3 flex flex-col cursor-pointer gap-2", {
				"bg-zinc-200/50 rounded-2xl": focusedClearCutId === id,
			})}
		>
			<div className="flex justify-between">
				<h3 className="me-auto text-lg font-bold text-gray-800">{city}</h3>
				<FormattedDate value={created_at} />
			</div>
			<StatusWithLabel status={status} />
			{comment && <p className="text-zinc-500 line-clamp-2">{comment}</p>}
			<div className="flex gap-2 ">
				{tags.map((tag) => (
					<RuleBadge key={tag.id} {...tag} />
				))}
			</div>
		</li>
	);
}
