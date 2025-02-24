import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
	open: boolean;
}
export function DropdownChevron({ open }: Props) {
	return open ? <ChevronUp /> : <ChevronDown />;
}
