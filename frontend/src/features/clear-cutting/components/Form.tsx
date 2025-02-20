import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { useMapInstance } from "@/features/clear-cutting/components/map/Map.context";
import { useGetClearCuttingQuery } from "@/features/clear-cutting/store/api";
import { skipToken } from "@reduxjs/toolkit/query";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Accordion } from "radix-ui";
import { useEffect } from "react";

type AsideFormProps = {
	clearCuttingId?: string;
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

export function AsideForm({ clearCuttingId }: AsideFormProps) {
	const { data } = useGetClearCuttingQuery(clearCuttingId ?? skipToken);
	const { map } = useMapInstance();

	useEffect(() => {
		if (map && data) {
			map.flyTo(data?.geoCoordinates[0], 10, { duration: 1 });
		}
	}, [map, data]);

	return (
		<>
			<Link to="/map/list">
				<X />
			</Link>
			<Accordion.Root className="w-full" type="multiple">
				<AccordionItem value="item-1">
					<AccordionTrigger>Is it accessible?</AccordionTrigger>
					<AccordionContent>
						Yes. It adheres to the WAI-ARIA design pattern.
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="item-2">
					<AccordionTrigger>Is it unstyled?</AccordionTrigger>
					<AccordionContent>
						Yes. It's unstyled by default, giving you freedom over the look and
						feel.
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="item-3">
					<AccordionTrigger>Can it be animated?</AccordionTrigger>
					<AccordionContent>
						Yes! You can animate the Accordion with CSS or JavaScript.
					</AccordionContent>
				</AccordionItem>
			</Accordion.Root>
		</>
	);
}
