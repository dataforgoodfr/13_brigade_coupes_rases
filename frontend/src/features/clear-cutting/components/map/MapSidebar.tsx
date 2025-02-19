import { AsideList } from "@/features/clear-cutting/components/List";
import { useState } from "react";
import { AsideForm } from "@/features/clear-cutting/components/Form";
import { ClearCuttingPreview } from "../../store/clear-cuttings";

export function MapSidebar() {
	const [selectedClearCuttingPreview, setSelectedClearCuttingPreview] = useState<ClearCuttingPreview | null>(null);
	
	return ( 
		<>
			{ selectedClearCuttingPreview ? 
				<AsideForm clearCuttingPreview={selectedClearCuttingPreview} onClose={() => setSelectedClearCuttingPreview(null)} /> : 
				<AsideList setSelectedClearCuttingPreview={setSelectedClearCuttingPreview}/> }
		</>);
}
