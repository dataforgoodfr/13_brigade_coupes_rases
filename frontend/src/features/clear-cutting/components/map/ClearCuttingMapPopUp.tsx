import { Badge } from "@/components/ui/badge";
import { Dot } from "@/components/ui/dot";
import { Popup } from "react-leaflet";

export function ClearCuttingMapPopUp() {
	return (
		<>
			<Popup closeButton={false} maxWidth={350} >
				<div className="flex justify-between items-center mb-5 w-full">
					<div className="flex items-center">
						<h2 className="font-semibold text-lg">Nom coupe rase</h2>

						<Dot className="ml-2.5" color="red"/>
					</div>
					<div className="text-sm">25/10/2024</div>
				</div>
                <div className="flex mb-5 gap-2" >
					<Badge className="text-sm" variant="secondary">Natura 2000</Badge>
					<Badge className="text-sm" variant="secondary">Pente > 30%</Badge>
					<Badge className="text-sm" variant="secondary">Sup 20 HA</Badge>
				</div>
                <div className="flex flex-col gap-2.5 text-base text-secondary">
					<div>Date du signalement : <strong>JJ/MM/AAA</strong></div>
					<div>Taille de la coupe : <strong>30 HA</strong></div>
					<div>Pente : <strong>45 %</strong></div>
					<div>Zone Natura : <strong>XXX</strong></div>
				</div>
			</Popup>
		</>
	);
}
