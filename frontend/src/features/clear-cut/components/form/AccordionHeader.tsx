import { FormattedNumber } from "react-intl";
import { Separator } from "@/components/ui/separator";
import type {
	ClearCutFormInput,
	ClearCutStatus,
} from "@/features/clear-cut/store/clear-cuts";
import type { FormType } from "@/shared/components/form/Form";
import type { Rule } from "@/shared/store/referential/referential";
import { RuleBadge } from "../RuleBadge";
import { StatusWithLabel } from "../StatusWithLabel";

export default function AccordionHeader({
	form,
	tags: abusiveTags,
	status,
}: {
	form: FormType<ClearCutFormInput>;
	tags: Rule[];
	status: ClearCutStatus;
}) {
	const areaHectare = form.getValues("report.totalAreaHectare");
	const ecologicalZonings = form.getValues("ecologicalZonings");
	return (
		<div className="flex items-center mx-4 mt-4 gap-6 text-sm">
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
				<div className="flex items-center gap-2 mb-4">
					<StatusWithLabel status={status} />
				</div>
				<div className="flex flex-col gap-2 flex-wrap mb-4">
					{abusiveTags.map((tag) => (
						<RuleBadge className="max-w-fit" key={tag.id} {...tag} />
					))}
				</div>
				<Separator className="mb-4" />
				{areaHectare !== undefined && (
					<p>
						Superficie de la coupe : <FormattedNumber value={areaHectare} /> ha
					</p>
				)}
				{ecologicalZonings !== undefined && (
					<p>
						Zones écologique : {ecologicalZonings.map((z) => z.name).join(", ")}
					</p>
				)}
			</div>
		</div>
	);
}
