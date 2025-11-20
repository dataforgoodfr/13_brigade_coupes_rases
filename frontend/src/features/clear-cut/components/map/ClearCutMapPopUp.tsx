import { useMemo } from "react";
import { FormattedDate, FormattedNumber, useIntl } from "react-intl";
import { Popup } from "react-leaflet";
import { DotByStatus } from "@/features/clear-cut/components/DotByStatus";
import { RuleBadge } from "@/features/clear-cut/components/RuleBadge";
import type { ClearCutReport } from "@/features/clear-cut/store/clear-cuts";

type Props = {
	totalAreaHectare: number;
	totalBdfDeciduousAreaHectare?: number;
	totalBdfMixedAreaHectare?: number;
	totalBdfPoplarAreaHectare?: number;
	totalBdfResinousAreaHectare?: number;
};
function BDFLabel({
	totalAreaHectare,
	totalBdfDeciduousAreaHectare,
	totalBdfMixedAreaHectare,
	totalBdfPoplarAreaHectare,
	totalBdfResinousAreaHectare,
}: Props) {
	const { formatNumber } = useIntl();
	const types = {
		Feuillus: totalBdfDeciduousAreaHectare,
		Mélangée: totalBdfMixedAreaHectare,
		Peupleraie: totalBdfPoplarAreaHectare,
		Résineux: totalBdfResinousAreaHectare,
	};

	const relevantTypes = Object.entries(types)
		.map(([label, value]) => ({
			label,
			percentage: (value || 0) / totalAreaHectare,
		}))
		// Only display types with a coverage > 1%
		.filter(({ percentage }) => percentage >= 0.01)
		// Display types in coverage descending order
		.sort((a, b) => b.percentage - a.percentage);

	const labelString = relevantTypes
		.map(
			({ label, percentage }) =>
				`${label} (${formatNumber(percentage, { style: "percent" })})`,
		)
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
		firstCutDate,
		totalAreaHectare,
		updatedAt,
		slopeAreaHectare,
		clearCuts,
		city,
		name,
		totalBdfDeciduousAreaHectare,
		totalBdfMixedAreaHectare,
		totalBdfPoplarAreaHectare,
		totalBdfResinousAreaHectare,
	},
}: {
	report: ClearCutReport;
}) {
	const ecological_zonings = useMemo(() => {
		const uniqNames = new Set(
			clearCuts.flatMap((z) => z.ecologicalZonings).map((z) => z.name),
		);
		return Array.from(uniqNames).join(",");
	}, [clearCuts]);
	return (
		<Popup closeButton={false} maxWidth={350}>
			<div className="flex justify-between items-center mb-5 w-full font-inter">
				<div className="flex items-center">
					<h2 className="font-semibold text-lg">{name ?? city}</h2>
					<DotByStatus className="ml-2.5" status={status} />
				</div>
			</div>

			<div className="flex mb-5 gap-2 font-inter">
				{tags.map((tag) => (
					<RuleBadge key={tag.id} {...tag} />
				))}
			</div>

			<div className="flex flex-col gap-2.5 text-base text-secondary font-jakarta font-medium">
				<div>
					Date de la coupe :{" "}
					<strong>
						<FormattedDate value={firstCutDate} />
					</strong>
				</div>
				<div>
					Date du signalement :{" "}
					<strong>
						<FormattedDate value={updatedAt} />
					</strong>
				</div>
				<div>
					Taille de la coupe :
					<strong>
						{" "}
						<FormattedNumber value={totalAreaHectare} /> HA
					</strong>
				</div>
				{slopeAreaHectare && (
					<div>
						{"Pente raide (>30%) :"}
						<strong>
							{" "}
							<FormattedNumber
								value={slopeAreaHectare}
								maximumFractionDigits={2}
							/>{" "}
							ha
						</strong>
					</div>
				)}
				{ecological_zonings && (
					<div>
						Zones Natura :<strong>{ecological_zonings}</strong>
					</div>
				)}
				<BDFLabel
					totalAreaHectare={totalAreaHectare}
					totalBdfDeciduousAreaHectare={totalBdfDeciduousAreaHectare}
					totalBdfMixedAreaHectare={totalBdfMixedAreaHectare}
					totalBdfPoplarAreaHectare={totalBdfPoplarAreaHectare}
					totalBdfResinousAreaHectare={totalBdfResinousAreaHectare}
				/>
			</div>
		</Popup>
	);
}
