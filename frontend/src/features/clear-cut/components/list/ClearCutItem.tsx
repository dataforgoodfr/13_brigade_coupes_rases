import clsx from "clsx"
import { FormattedDate } from "react-intl"

import { useMapInstance } from "@/features/clear-cut/components/map/Map.context"
import { RuleBadge } from "@/features/clear-cut/components/RuleBadge"
import { StatusWithLabel } from "@/features/clear-cut/components/StatusWithLabel"
import { useNavigateToClearCut } from "@/features/clear-cut/hooks"
import type { ClearCutReport } from "@/features/clear-cut/store/clear-cuts"
import { useBreakpoint } from "@/shared/hooks/breakpoint"


export function ClearCutItem({
	id,
	firstCutDate,
	status,
	comment,
	rules: tags,
	city
}: ClearCutReport) {
	const handleCardClick = useNavigateToClearCut(id)
	const { focusedClearCutId, setFocusedClearCutId } = useMapInstance()
	const { breakpoint } = useBreakpoint()

	return (
		<li
			onClick={() => handleCardClick()}
			onMouseEnter={
				breakpoint !== "mobile" ? () => setFocusedClearCutId(id) : undefined
			}
			onMouseLeave={
				breakpoint !== "mobile"
					? () => setFocusedClearCutId(undefined)
					: undefined
			}
			onKeyUp={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					handleCardClick()
				}
			}}
			className={clsx("p-3 flex flex-col cursor-pointer gap-1 border-b-1", {
				"bg-zinc-200/50": focusedClearCutId === id
			})}
		>
			<div className="flex justify-between">
				<h3 className="me-auto text-lg font-bold text-gray-800">{city}</h3>
				<FormattedDate value={firstCutDate}>
					{(formattedDate) => (
						<span title="Date de la première coupe">{formattedDate}</span>
					)}
				</FormattedDate>
			</div>
			<div className="flex justify-between items-center">
				<StatusWithLabel status={status} />
			</div>
			{comment && <p className="text-zinc-500 line-clamp-2">{comment}</p>}
			<div className="flex gap-2 ">
				{tags.map((tag) => (
					<RuleBadge key={tag.id} {...tag} />
				))}
			</div>
		</li>
	)
}
