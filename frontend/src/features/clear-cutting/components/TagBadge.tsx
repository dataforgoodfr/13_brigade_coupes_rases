import { Badge } from "@/components/ui/badge";
import type { Tag } from "@/shared/store/referential/referential";

function translateTag(tag: Tag) {
	switch (tag.type) {
		case "ecological_zoning":
			return "Natura 2000";
		case "excessive_area":
			return `Sup ${tag.value} HA`;
		case "excessive_slop":
			return `Pente > ${tag.value} %`;
	}
}
export function TagBadge(tag: Tag) {
	return <Badge variant="default">{translateTag(tag)}</Badge>;
}
