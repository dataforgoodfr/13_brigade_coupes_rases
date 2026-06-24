import { useNavigate } from "@tanstack/react-router"
import { Filter } from "lucide-react"
import { type PropsWithChildren, useState } from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AdvancedFilters } from "@/features/clear-cut/components/filters/AdvancedFilters"
import { selectResetVersion } from "@/features/clear-cut/store/filters.slice"
import { IconButton } from "@/shared/components/button/Button"
import { useAppSelector } from "@/shared/hooks/store"

type Props = PropsWithChildren<{ clearCutId?: string }>

export function MobileControl({ clearCutId, children }: Props) {
	const navigate = useNavigate()
	const resetVersion = useAppSelector(selectResetVersion)
	const [open, setOpen] = useState(false)
	return (
		<Sheet open={open} onOpenChange={setOpen}>
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
				<SheetTrigger asChild>
					<IconButton variant="white" icon={<Filter />} position="start">
						Filtres
					</IconButton>
				</SheetTrigger>
			</div>

			<SheetContent title="Filtres" className="sm:hidden">
				<div className="overflow-y-auto">
					<AdvancedFilters
						key={resetVersion}
						className="px-1 bg-background"
						onClose={() => setOpen(false)}
					/>
				</div>
			</SheetContent>
		</Sheet>
	)
}
