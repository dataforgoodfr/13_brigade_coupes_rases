import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
	open: boolean;
}
export function ExpandChevron({ open }: Props) {
	return open ? <ChevronUp /> : <ChevronDown />;
}
