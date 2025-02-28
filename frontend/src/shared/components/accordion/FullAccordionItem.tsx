import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import React from "react";

type AccordionFullItemProps = {
	title: string;
	children?: React.ReactNode;
};

export function AccordionFullItem({ title, children }: AccordionFullItemProps) {
	const val = React.useId();

	return (
		<>
			<AccordionItem
				value={val}
				className="data-[state=closed]:border-b-2 data-[state=closed]:border-(--border) data-[state=open]:border-b-0"
			>
				<AccordionTrigger className="cursor-pointer">{title}</AccordionTrigger>
				<AccordionContent>
					{children ??
						"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."}
				</AccordionContent>
			</AccordionItem>
		</>
	);
}
