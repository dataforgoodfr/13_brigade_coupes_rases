import { DotByStatus } from "@/features/clear-cut/components/DotByStatus";
import { TagBadge } from "@/features/clear-cut/components/TagBadge";
import type { ClearCutReport } from "@/features/clear-cut/store/clear-cuts";
import { useMemo } from "react";
import { Popup } from "react-leaflet";

export function ClearCutMapPopUp({
	report: {
		status,
		tags,
		last_cut_date,
		total_area_hectare,
		updated_at,
		slope_area_ratio_percentage,
		clear_cuts,
		city,
		name,
	},
}: { report: ClearCutReport }) {
	const ecological_zonings = useMemo(() => {
		const uniqNames = new Set(
			clear_cuts.flatMap((z) => z.ecologicalZonings).map((z) => z.name),
		);
		return Array.from(uniqNames).join(",");
	}, [clear_cuts]);
	return (
		<>
			<Popup closeButton={false} maxWidth={350}>
				<div className="flex justify-between items-center mb-5 w-full font-inter">
					<div className="flex items-center">
						<h2 className="font-semibold text-lg">{name ?? city}</h2>

						<DotByStatus className="ml-2.5" status={status} />
					</div>
					<div className="text-sm">{last_cut_date}</div>
				</div>

				<div className="flex mb-5 gap-2 font-inter">
					{tags.map((tag) => (
						<TagBadge key={tag.id} {...tag} />
					))}
				</div>

				<div className="flex flex-col gap-2.5 text-base text-secondary font-jakarta font-medium">
					<div>
						Date du signalement : <strong>{updated_at}</strong>
					</div>
					<div>
						Taille de la coupe :<strong> {total_area_hectare} HA</strong>
					</div>
					<div>
						Pente : <strong>{slope_area_ratio_percentage} %</strong>
					</div>
					<div>
						Zones Natura :<strong>{ecological_zonings}</strong>
					</div>
				</div>
			</Popup>
		</>
	);
}
