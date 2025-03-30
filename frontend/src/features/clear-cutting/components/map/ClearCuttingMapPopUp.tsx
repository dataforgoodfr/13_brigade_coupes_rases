import { DotByStatus } from "@/features/clear-cutting/components/DotByStatus";
import { TagBadge } from "@/features/clear-cutting/components/TagBadge";
import type { ClearCuttingPreview } from "@/features/clear-cutting/store/clear-cuttings";
import { Popup } from "react-leaflet";

export function ClearCuttingMapPopUp({
	clearCutting: {
		name,
		status,
		cut_date,
		tags,
		created_at,
		area_hectare,
		slope_percentage,
		ecologicalZonings,
	},
}: { clearCutting: ClearCuttingPreview }) {
	return (
		<>
			<Popup closeButton={false} maxWidth={350}>
				<div className="flex justify-between items-center mb-5 w-full font-inter">
					<div className="flex items-center">
						<h2 className="font-semibold text-lg">{name}</h2>

						<DotByStatus className="ml-2.5" status={status} />
					</div>
					<div className="text-sm">{cut_date}</div>
				</div>

				<div className="flex mb-5 gap-2 font-inter">
					{tags.map((tag) => (
						<TagBadge key={tag.id} {...tag} />
					))}
				</div>

				<div className="flex flex-col gap-2.5 text-base text-secondary font-jakarta font-medium">
					<div>
						Date du signalement : <strong>{created_at}</strong>
					</div>
					<div>
						Taille de la coupe :<strong> {area_hectare} HA</strong>
					</div>
					<div>
						Pente : <strong>{slope_percentage} %</strong>
					</div>
					<div>
						Zones Natura :{" "}
						<strong> {ecologicalZonings.map((z) => z.name).join(",")} </strong>
					</div>
				</div>
			</Popup>
		</>
	);
}
