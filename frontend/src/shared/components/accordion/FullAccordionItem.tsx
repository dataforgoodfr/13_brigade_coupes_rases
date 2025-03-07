import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { cn } from "@/lib/utils";
import React from "react";

type AccordionFullItemProps = {
	title: string;
	children?: React.ReactNode;
	className?: string;
	className?: string;
};

export function AccordionFullItem({ title, children, className }: AccordionFullItemProps) {
export function AccordionFullItem({
	title,
	children,
	className,
}: AccordionFullItemProps) {
	const val = React.useId();

	return (
		<>
			<AccordionItem
				value={val}
				className={cn(
							"data-[state=closed]:border-b-2 data-[state=closed]:border-(--border) data-[state=open]:border-b-0 text-(--color-primary)",
							className,
						)}
				className="data-[state=closed]:border-b-1 data-[state=closed]:border-(--border) data-[state=open]:border-b-0 overflow-hidden"
			>
				<AccordionTrigger className="cursor-pointer text-2xl">{title}</AccordionTrigger>
				<AccordionContent className="text-black">
					{children}
				<AccordionTrigger className="cursor-pointer text-lg font-bold font-[Roboto]">
					{title}
				</AccordionTrigger>
				<AccordionContent
					className={cn(
						"font-[Roboto] border-t-1 pt-4 overflow-hidden",
						className,
					)}
				>
					{children}
				</AccordionContent>
			</AccordionItem>
		</>
	);
}
