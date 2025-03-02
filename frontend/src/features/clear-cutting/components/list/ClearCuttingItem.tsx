import { DotByStatus } from "@/features/clear-cutting/components/DotByStatus";
import { TagBadge } from "@/features/clear-cutting/components/TagBadge";
import type { ClearCuttingPreview } from "@/features/clear-cutting/store/clear-cuttings";
import { CLEAR_CUTTING_STATUS_TRANSLATIONS } from "@/features/clear-cutting/store/status";
import { useNavigate } from "@tanstack/react-router";

export function ClearCuttingItem({
	id,
	reportDate,
	status,
	comment,
	abusiveTags,
	address: { city },
}: ClearCuttingPreview) {
	const navigate = useNavigate();
	const handleCardClick = () => {
		navigate({
			to: "/clear-cuttings/$clearCuttingId",
			params: { clearCuttingId: id },
		});
	};

	return (
		<li
			onClick={() => handleCardClick()}
			onKeyUp={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					handleCardClick();
				}
			}}
			className="flex flex-col cursor-pointer gap-2"
		>
			<div className="flex justify-between">
				<h3 className="me-auto text-lg font-bold text-gray-800">{city}</h3>
				{reportDate}
			</div>
			<div className="flex items-center gap-2">
				<DotByStatus status={status} />
				{CLEAR_CUTTING_STATUS_TRANSLATIONS[status]}
			</div>
			{comment && <p className="text-zinc-500 line-clamp-2">{comment}</p>}
			<div className="flex gap-2 ">
				{abusiveTags.map((tag) => (
					<TagBadge key={tag.id} {...tag} />
				))}
			</div>
		</li>
	);
}
