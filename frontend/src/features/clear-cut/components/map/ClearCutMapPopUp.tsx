import { DotByStatus } from "@/features/clear-cut/components/DotByStatus";
import { RuleBadge } from "@/features/clear-cut/components/RuleBadge";
import type { ClearCutReport } from "@/features/clear-cut/store/clear-cuts";
import { useMemo } from "react";
import { Popup } from "react-leaflet";

function BDFLabel({
	total_area_hectare,
	total_bdf_deciduous_area_hectare,
	total_bdf_mixed_area_hectare,
	total_bdf_poplar_area_hectare,
	total_bdf_resinous_area_hectare,
}: {
	total_area_hectare: number;
	total_bdf_deciduous_area_hectare: number;
	total_bdf_mixed_area_hectare: number;
	total_bdf_poplar_area_hectare: number;
	total_bdf_resinous_area_hectare: number;
}) {
	const types = {
		Feuillus: total_bdf_deciduous_area_hectare,
		Mélangée: total_bdf_mixed_area_hectare,
		Peupleraie: total_bdf_poplar_area_hectare,
		Résineux: total_bdf_resinous_area_hectare,
	};

	const relevantTypes = Object.entries(types)
		// Convert hectares to percentages
		.map(([label, value]) => ({
			label,
			percentage: (value / total_area_hectare) * 100,
		}))
		// Only display types with a coverage > 1%
		.filter(({ percentage }) => percentage >= 1)
		// Display types in coverage descending order
		.sort((a, b) => b.percentage - a.percentage);

	const labelString = relevantTypes
		.map(({ label, percentage }) => `${label} (${Math.round(percentage)}%)`)
		.join(" / ");

	return (
		<div>
			Type de forêt : <strong>{labelString || "Non renseigné"}</strong>
		</div>
	);
}

export function ClearCutMapPopUp({
	report: {
		status,
		rules: tags,
		last_cut_date,
		total_area_hectare,
		updated_at,
		slope_area_ratio_percentage,
		clear_cuts,
		city,
		name,
		total_bdf_deciduous_area_hectare,
		total_bdf_mixed_area_hectare,
		total_bdf_poplar_area_hectare,
		total_bdf_resinous_area_hectare,
	},
}: {
	report: ClearCutReport;
}) {
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
						<RuleBadge key={tag.id} {...tag} />
					))}
				</div>

				<div className="flex flex-col gap-2.5 text-base text-secondary font-jakarta font-medium">
					<div>
						Date du signalement : <strong>{updated_at}</strong>
					</div>
					<div>
						Taille de la coupe :
						<strong> {total_area_hectare.toFixed(2)} HA</strong>
					</div>
					<div>
						Pente : <strong>{slope_area_ratio_percentage} %</strong>
					</div>
					<div>
						Zones Natura :<strong>{ecological_zonings}</strong>
					</div>
					<BDFLabel
						total_area_hectare={total_area_hectare}
						total_bdf_deciduous_area_hectare={total_bdf_deciduous_area_hectare}
						total_bdf_mixed_area_hectare={total_bdf_mixed_area_hectare}
						total_bdf_poplar_area_hectare={total_bdf_poplar_area_hectare}
						total_bdf_resinous_area_hectare={total_bdf_resinous_area_hectare}
					/>
				</div>
			</Popup>
		</>
	);
}
