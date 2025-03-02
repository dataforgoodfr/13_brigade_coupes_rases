import { Badge } from "@/components/ui/badge";
import {
	type ClearCuttingPreview,
	getClearCuttingStatusColor,
} from "@/features/clear-cutting/store/clear-cuttings";
import { Dot } from "@/shared/components/dot";
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

						<Dot
							className="ml-2.5"
							color={getClearCuttingStatusColor(clearCutting.status)}
						/>
					</div>
					<div className="text-sm">{clearCutting.creationDate}</div>
				</div>

				<div className="flex mb-5 gap-2 font-inter">
					{clearCutting.abusiveTags.map((tag) => (
						<Badge key={tag} className="text-sm" variant="secondary">
							{tag}
						</Badge>
					))}
				</div>

				<div className="flex flex-col gap-2.5 text-base text-secondary font-jakarta font-medium">
					<div>
						Date du signalement : <strong>{clearCutting.reportDate}</strong>
					</div>
					<div>
						Taille de la coupe :
						<strong> {clearCutting.cadastralParcel?.surfaceKm} HA</strong>
					</div>
					<div>
						Pente : <strong>{clearCutting.cadastralParcel?.slope} %</strong>
					</div>
					<div>
						Zone Natura : <strong> {clearCutting.naturaZone} </strong>
					</div>
				</div>
			</Popup>
		</>
	);
}
