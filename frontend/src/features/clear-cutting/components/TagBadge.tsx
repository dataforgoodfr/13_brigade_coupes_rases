import { Badge } from "@/components/ui/badge";
import type { Tag } from "@/shared/store/referential/referential";

function translateTag(tag: Tag) {
	switch (tag.type) {
		case "ecologicalZoning":
			return "Natura 2000";
		case "excessiveArea":
			return `Sup ${tag.value} HA`;
		case "excessiveSlop":
			return `Pente > ${tag.value} %`;
	}
}
export function TagBadge(tag: Tag) {
	return <Badge variant="default">{translateTag(tag)}</Badge>;
}
