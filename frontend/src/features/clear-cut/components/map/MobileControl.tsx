import { AdvancedFilters } from "@/features/clear-cut/components/filters/AdvancedFilters";
import { useLayout } from "@/features/clear-cut/components/Layout.context";
import { IconButton } from "@/shared/components/button/Button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { Filter, ListIcon } from "lucide-react";

export function MobileControl() {
	const { setLayout } = useLayout();
	return (
		<Collapsible>
			<div className="flex justify-end">
				<IconButton
					variant="white"
					className="sm:hidden mx-1"
					onClick={() => setLayout("list")}
					icon={<ListIcon />}
					title="Afficher la liste"
					position="start"
				/>
				<CollapsibleTrigger asChild>
					<IconButton variant="white" icon={<Filter />} position="start">
						Filtres
					</IconButton>
				</CollapsibleTrigger>
			</div>

			<CollapsibleContent>
				<AdvancedFilters className="mt-6 px-5 bg-zinc-50" />
			</CollapsibleContent>
		</Collapsible>
	);
}
