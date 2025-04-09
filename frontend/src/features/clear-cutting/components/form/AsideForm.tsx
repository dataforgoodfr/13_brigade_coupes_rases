import { useMapInstance } from "@/features/clear-cutting/components/map/Map.context";
import { useGetClearCutting } from "@/features/clear-cutting/store/clear-cuttings-slice";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect } from "react";
import { FormattedDate } from "react-intl";
import ClearCuttingFullForm from "./ClearCuttingFullForm";

export function AsideForm({ clearCuttingId }: { clearCuttingId: string }) {
	const { value, status } = useGetClearCutting(clearCuttingId);
	const { map } = useMapInstance();
	const { toast } = useToast();
	const navigate = useNavigate();

	useEffect(() => {
		if (status === "error") {
			toast({
				title: "Fiche non trouvée",
				description: "Fermer pour retourner à la carte",
				onClose: () => {
					navigate({ to: "/clear-cuttings" });
				},
			});
		}
	}, [status, navigate, toast]);

	useEffect(() => {
		if (map && value?.average_location.coordinates) {
			map.flyTo(
				[
					value.average_location.coordinates[1],
					value.average_location.coordinates[0],
				],
				10,
				{ duration: 1 },
			);
		}
	}, [map, value]);

	return (
		value && (
			<div className="lg:inset-y-0 lg:z-50 lg:flex lg:w-200 lg:flex-col">
				<div className="relative pt-6 px-4 pb-1 border-b-1">
					<Link to="/clear-cuttings" className="absolute right-2 top-1">
						<X size={30} />
					</Link>
					<h1 className="text-2xl font-extrabold font-[Manrope]">{`${value?.city.toLocaleUpperCase()}`}</h1>
					<span className="font-[Roboto]">
						<FormattedDate value={value.last_cut_date} />
					</span>
				</div>
				<ClearCuttingFullForm clearCutting={value} />
			</div>
		)
	);
}
