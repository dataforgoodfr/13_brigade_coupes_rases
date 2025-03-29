import { DotByStatus } from "@/features/clear-cutting/components/DotByStatus";
import { TagBadge } from "@/features/clear-cutting/components/TagBadge";
import type { ClearCuttingPreview } from "@/features/clear-cutting/store/clear-cuttings";
import { Popup } from "react-leaflet";

export function ClearCuttingMapPopUp({
	clearCutting,
}: { clearCutting: ClearCuttingPreview }) {
	return (
		<>
			<Popup closeButton={false} maxWidth={350}>
				<div className="flex justify-between items-center mb-5 w-full font-inter">
					<div className="flex items-center">
						<h2 className="font-semibold text-lg">{clearCutting.name}</h2>

						<DotByStatus className="ml-2.5" status={clearCutting.status.name} />
					</div>
					<div className="text-sm">{clearCutting.creationDate}</div>
				</div>

				<div className="flex mb-5 gap-2 font-inter">
					{clearCutting.abusiveTags.map((tag) => (
						<TagBadge key={tag.id} {...tag} />
					))}
				</div>

				<div className="flex flex-col gap-2.5 text-base text-secondary font-jakarta font-medium">
					<div>
						Date du signalement : <strong>{clearCutting.reportDate}</strong>
					</div>
					<div>
						Taille de la coupe :
						<strong> {clearCutting?.area_hectare} HA</strong>
					</div>
					<div>
						Pente : <strong>{clearCutting?.slope_percentage} %</strong>
					</div>
					<div>
						Zone Natura : <strong> {clearCutting.naturaZone} </strong>
					</div>
				</div>
			</Popup>
		</>
	);
}
