import { Badge } from "@/components/ui/badge";
import type { Rule } from "@/shared/store/referential/referential";

function translateRule(rule: Rule) {
	switch (rule.type) {
		case "ecological_zoning":
			return "Natura 2000";
		case "area":
			return `Sup ${rule.threshold} HA`;
		case "slope":
			return `Pente > 30 %`;
	}
}
export function RuleBadge(tag: Rule & { className?: string }) {
	return (
		<Badge className={tag.className} variant="default">
			{translateRule(tag)}
		</Badge>
	);
}
