import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from "@radix-ui/react-collapsible"
import { useNavigate } from "@tanstack/react-router"
import { Filter } from "lucide-react"
import type { PropsWithChildren } from "react"

import { Button } from "@/components/ui/button"
import { AdvancedFilters } from "@/features/clear-cut/components/filters/AdvancedFilters"
import { IconButton } from "@/shared/components/button/Button"

type Props = PropsWithChildren<{ clearCutId?: string }>

export function MobileControl({ clearCutId, children }: Props) {
	const navigate = useNavigate()
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
								params: { clearCutId }
							})
						}}
					>
						Détail
					</Button>
				)}
				<CollapsibleTrigger asChild>
					<IconButton variant="white" icon={<Filter />} position="start">
						Filtres
					</IconButton>
				</CollapsibleTrigger>
			</div>

			<CollapsibleContent>
				<AdvancedFilters className="mt-6 px-3 bg-background" />
			</CollapsibleContent>
		</Collapsible>
	)
}
