import { Badge } from "@/components/ui/badge";
import { Dot } from "@/components/ui/dot";
import { Popup } from "react-leaflet";
import type { ClearCuttingPreview } from "@/features/clear-cutting/store/clear-cuttings";

export function ClearCuttingMapPopUp({clearCutting}: {clearCutting: ClearCuttingPreview}) {
	return (
		<>
			<Popup closeButton={false} maxWidth={350}  >
				<div className="flex justify-between items-center mb-5 w-full font-[Inter]">
					<div className="flex items-center">
						<h2 className="font-semibold text-lg">{clearCutting.name}</h2>

						<Dot className="ml-2.5" color="red"/>
					</div>
					<div className="text-sm">{clearCutting.creationDate}</div>
				</div>

                <div className="flex mb-5 gap-2 font-[Inter]" >

					{clearCutting.abusiveTags.map(tag=>(
						<Badge key={tag} className="text-sm" variant="secondary">{tag}</Badge>
					))}

				</div>

                <div className="flex flex-col gap-2.5 text-base text-secondary font-[Plus Jakarta Sans] font-medium">
					<div>Date du signalement : <strong>{clearCutting.reportDate}</strong></div>
					<div>Taille de la coupe : <strong>{clearCutting.cadastralParcel?.surfaceKm} HA</strong></div>
					<div>Pente : <strong>{clearCutting.cadastralParcel?.slope} %</strong></div>
					<div>Zone Natura : <strong> {/** TODO */} </strong></div>
				</div>
			</Popup>
		</>
	);
}
