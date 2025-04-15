import { Button } from "@/components/ui/button";
import { useLayout } from "@/features/clear-cut/components/Layout.context";
import { AdvancedFilters } from "@/features/clear-cut/components/filters/AdvancedFilters";
import { IconButton } from "@/shared/components/button/Button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { useNavigate } from "@tanstack/react-router";
import { Filter, ListIcon } from "lucide-react";
import type { PropsWithChildren } from "react";
type Props = PropsWithChildren<{ clearCutId?: string }>;
export function MobileControl({ clearCutId, children }: Props) {
	const { setLayout } = useLayout();
	const navigate = useNavigate();
	return (
		<Collapsible>
			<div className="flex justify-end sm:hidden">
				{children}
				{clearCutId && (
					<Button
						variant="default"
						onClick={() => {
							navigate({
								to: "/clear-cuts/$clearCutId",
								params: { clearCutId },
							});
						}}
					>
						Détail
					</Button>
				)}

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
