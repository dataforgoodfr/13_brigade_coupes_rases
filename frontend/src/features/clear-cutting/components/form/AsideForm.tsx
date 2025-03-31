import { useMapInstance } from "@/features/clear-cutting/components/map/Map.context";
import { useGetClearCutting } from "@/features/clear-cutting/store/clear-cuttings-slice";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect } from "react";
import ClearCuttingFullForm from "./ClearCuttingFullForm";

export function AsideForm({ clearCuttingId }: { clearCuttingId: string }) {
	const { value } = useGetClearCutting(clearCuttingId);
	const { map } = useMapInstance();

	useEffect(() => {
		if (map && value) {
			map.flyTo(value?.geoCoordinates[0], 10, { duration: 1 });
		}
	}, [map, value]);

	return (
		value && (
			<div className="lg:inset-y-0 lg:z-50 lg:flex lg:w-200 lg:flex-col">
				<div className="relative pt-6 px-4 pb-1 border-b-1">
					<Link to="/clear-cuttings" className="absolute right-2 top-1">
						<X size={30} />
					</Link>
					<h1 className="text-2xl font-extrabold font-[Manrope]">{`${value?.address.city.toLocaleUpperCase()}`}</h1>
					<span className="font-[Roboto]">
						{new Date(value.reportDate).toLocaleDateString()}
					</span>
				</div>
				<ClearCuttingFullForm clearCutting={value} />
			</div>
		)
	);
}
