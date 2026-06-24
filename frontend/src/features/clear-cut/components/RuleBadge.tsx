import { TriangleAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Rule } from "@/shared/store/referential/referential"

function translateRule(rule: Rule) {
	switch (rule.type) {
		case "ecological_zoning":
			return "Natura 2000"
		case "area":
			return `Sup ${rule.threshold} HA`
		case "slope":
			return "Pente > 30 %"
	}
}

// Rule badges flag *why a cut may be abusive* — they are risk indicators, not
// success states, so they read as amber warnings rather than the brand green.
export function RuleBadge(tag: Rule & { className?: string }) {
	return (
		<Badge
			variant="outline"
			className={cn(
				"gap-1 border-amber-300 bg-amber-50 text-amber-800",
				tag.className
			)}
		>
			<TriangleAlert className="size-3" aria-hidden />
			{translateRule(tag)}
		</Badge>
	)
}
