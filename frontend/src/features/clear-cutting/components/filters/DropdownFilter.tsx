import { BUTTON_PROPS } from "@/features/clear-cutting/components/filters/utils";
import { Button } from "@/shared/components/Button";
import { DropdownChevron } from "@/shared/components/dropdown/DropdownChevron";
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
			<DropdownMenuTrigger>
				<Button {...BUTTON_PROPS}>
					{filter} <DropdownChevron open={open} />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>{children}</DropdownMenuContent>
		</DropdownMenu>
	);
}
