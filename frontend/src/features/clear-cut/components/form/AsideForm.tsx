import { ClearCutFullForm } from "@/features/clear-cut/components/form/ClearCutFullForm";
import { useMapInstance } from "@/features/clear-cut/components/map/Map.context";
import { useGetClearCut } from "@/features/clear-cut/store/clear-cuts-slice";
import { useToast } from "@/hooks/use-toast";
import { useBreakpoint } from "@/shared/hooks/breakpoint";
import { Title } from "@radix-ui/react-toast";
import { Link, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect } from "react";
import { FormattedDate } from "react-intl";

export function AsideForm({ clearCutId }: { clearCutId: string }) {
	const { value, status } = useGetClearCut(clearCutId);
	const { map } = useMapInstance();
	const { toast } = useToast();
	const navigate = useNavigate();
	const { breakpoint } = useBreakpoint();
	useEffect(() => {
		if (status === "error") {
			toast({
				title: "Fiche non trouvée",
				description: "Fermer pour retourner à la carte",
				onClose: () => {
					navigate({ to: "/clear-cuts" });
				},
			});
		}
	}, [status, navigate, toast]);

	useEffect(() => {
		if (map && breakpoint === "all" && value?.average_location.coordinates) {
			map.flyTo(
				[
					value.average_location.coordinates[1],
					value.average_location.coordinates[0],
				],
				15,
				{ duration: 1 },
			);
		}
	}, [breakpoint, map, value]);

	return (
		value && (
			<div className="flex flex-col w-full">
				<div className=" pt-6 px-4 pb-1 border-b-1 flex align-middle justify-between">
					<div className="flex flex-col">
						<Title>{`${value?.city.toLocaleUpperCase()}`}</Title>
						<span className="font-[Roboto]">
							<FormattedDate value={value.last_cut_date} />
						</span>
					</div>
					<Link to="/clear-cuts">
						<X size={30} />
					</Link>
				</div>
				<ClearCutFullForm clearCut={value} />
			</div>
		)
	);
}
