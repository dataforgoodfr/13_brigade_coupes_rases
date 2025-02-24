import { ExpandButton } from "@/shared/components/button/ExpandButton";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/shared/components/dropdown/DropdownMenu";
import { type PropsWithChildren, useState } from "react";

interface Props extends PropsWithChildren {
	filter: string;
}
export function DropdownFilter({ children, filter }: Props) {
	const [open, setOpen] = useState(false);
	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<ExpandButton open={open}>{filter}</ExpandButton>
			</DropdownMenuTrigger>

			<DropdownMenuContent>{children}</DropdownMenuContent>
		</DropdownMenu>
	);
}
