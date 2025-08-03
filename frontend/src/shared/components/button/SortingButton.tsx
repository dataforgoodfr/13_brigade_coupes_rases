import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Sort } from "@/shared/api/api";

type Props = {
	onClick: () => void;
	children: React.ReactNode;
	sort?: Sort;
};

export const SortingButton: React.FC<Props> = ({ onClick, children, sort }) => {
	return (
		<Button variant="ghost" onClick={onClick}>
			{children}
			{sort === undefined && <ArrowUpDown />}
			{sort === "asc" && <ArrowUp />}
			{sort === "desc" && <ArrowDown />}
		</Button>
	);
};
