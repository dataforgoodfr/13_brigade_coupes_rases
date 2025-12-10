import { FormattedNumber } from "react-intl"

import { FavoriteButton } from "@/features/clear-cut/components/shared/FavoriteButton"
import type {
	ClearCutFormInput,
	ClearCutStatus
} from "@/features/clear-cut/store/clear-cuts"
import type { FormType } from "@/shared/form/types"
import type { Rule } from "@/shared/store/referential/referential"

import { RuleBadge } from "../RuleBadge"
import { StatusWithLabel } from "../StatusWithLabel"

export function AccordionHeader({
	form,
	tags: abusiveTags,
	status
}: {
	form: FormType<ClearCutFormInput>
	tags: Rule[]
	status: ClearCutStatus
}) {
	const areaHectare = form.getValues("report.totalAreaHectare")
	const ecologicalZonings = form.getValues("ecologicalZonings")

	return (
		<div className="flex items-center mx-4 mt-2 gap-6 text-sm border-b-1 pb-1">
			{form.getValues("report.satelliteImages")?.map((image) => (
				<img
					key={image}
					alt="Vue satellite de le coupe rase"
					src={image}
					loading="lazy"
					className="flex-1 aspect-square shadow-[0px_2px_6px_0px_#00000033] rounded-lg max-w-[45%]"
				/>
			))}

			<div className="flex-1">
				<div className="flex items-center justify-between gap-2">
					<StatusWithLabel status={status} />
					<FavoriteButton reportId={form.getValues("report.id")} />
				</div>
				<div className="flex gap-2 flex-wrap mb-2">
					{abusiveTags.map((tag) => (
						<RuleBadge className="max-w-fit" key={tag.id} {...tag} />
					))}
				</div>
				{areaHectare !== undefined && (
					<p>
						Superficie de la coupe : <FormattedNumber value={areaHectare} /> ha
					</p>
				)}
				{ecologicalZonings && ecologicalZonings.length > 0 && (
					<p>
						Zones écologiques :{" "}
						{ecologicalZonings.map((z) => z.name).join(", ")}
					</p>
				)}
			</div>
		</div>
	)
}
