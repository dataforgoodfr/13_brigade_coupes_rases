import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/shared/components/Button";
import { ChevronDown } from "lucide-react";
import type { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
	filter: string;
}
export function DropdownFilter({ children, filter }: Props) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Button
					variant="outline"
					className="text-secondary border-secondary rounded-full "
				>
					{filter} <ChevronDown />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>{children}</DropdownMenuContent>
		</DropdownMenu>
	);
}
