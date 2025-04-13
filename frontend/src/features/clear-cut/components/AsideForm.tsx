import { Button } from "@/components/ui/button";
import { useMapInstance } from "@/features/clear-cut/components/map/Map.context";
import { useGetClearCut } from "@/features/clear-cut/store/clear-cuts-slice";
import { AccordionFullItem } from "@/shared/components/accordion/FullAccordionItem";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Accordion } from "radix-ui";
import { useEffect } from "react";
import { useIntl } from "react-intl";

type AsideFormProps = {
	clearCutId: string;
};

const titleSection = [
	"Informations générales",
	"Terrain",
	"Zonages écologiques",
	"Acteurs engagés",
	"Réglementations",
	"Autres informations",
	"Sratégie juridique",
];

export function AsideForm({ clearCutId }: AsideFormProps) {
	const { value } = useGetClearCut(clearCutId);
	const { map } = useMapInstance();
	const { formatDate } = useIntl();
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
			<div className="m-3 lg:inset-y-0 lg:z-50 lg:flex lg:w-200 lg:flex-col px-0.5">
				<div className="flex m-4 text-3xl font-bold align-baseline">
					<Link to="/clear-cuts">
						<X size={40} />
					</Link>
					<h1 className="ml-6">{`${value.city.toLocaleUpperCase()} - ${formatDate(value.last_cut_date, {})}`}</h1>
				</div>
				<div className="p-2 flex flex-col flex-grow overflow-auto">
					<Accordion.Root type="multiple" className="grow">
						{titleSection.map((sectionName) => (
							<AccordionFullItem key={sectionName} title={sectionName} />
						))}
					</Accordion.Root>
				</div>
				<Button className="mx-auto mt-12 cursor-pointer" size="lg">
					Valider
				</Button>
			</div>
		)
	);
}
