import { cn } from "@/lib/utils"; // Si tu utilises une fonction pour concaténer les classes
import { ChevronDownIcon } from "lucide-react";
import { Accordion } from "radix-ui";
import * as React from "react";

const AccordionItem = React.forwardRef<
	React.ComponentRef<typeof Accordion.Item>,
	React.ComponentPropsWithoutRef<typeof Accordion.Item>
>(({ children, className, ...props }, forwardedRef) => (
	<Accordion.Item
		className={cn(
			"mt-px overflow-hidden first:mt-0 first:rounded-t last:rounded-b focus-within:relative focus-within:z-10 focus-within:shadow-[0_0_0_2px]",
			className,
		)}
		{...props}
		ref={forwardedRef}
	>
		{children}
	</Accordion.Item>
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
	React.ComponentRef<typeof Accordion.Trigger>,
	React.ComponentPropsWithoutRef<typeof Accordion.Trigger>
>(({ children, className, ...props }, forwardedRef) => (
	<Accordion.Header className="flex">
		<Accordion.Trigger
			className={cn(
				"group flex h-[45px] flex-1 cursor-default items-center justify-between px-5 text-[15px] leading-none shadow-[0_1px_0] outline-none ",
				className,
			)}
			{...props}
			ref={forwardedRef}
		>
			{children}
			<ChevronDownIcon
				className="transition-transform duration-300 ease-[cubic-bezier(0.87,_0,_0.13,_1)] group-data-[state=open]:rotate-180"
				aria-hidden
			/>
		</Accordion.Trigger>
	</Accordion.Header>
));
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<
	React.ComponentRef<typeof Accordion.Content>,
	React.ComponentPropsWithoutRef<typeof Accordion.Content>
>(({ children, className, ...props }, forwardedRef) => (
	<Accordion.Content
		className={cn(
			"overflow-hidden text-[15px] data-[state=closed]:slide-up data-[state=open]:slide-down",
			className,
		)}
		{...props}
		ref={forwardedRef}
	>
		<div className="px-5 py-[15px]">{children}</div>
	</Accordion.Content>
));
AccordionContent.displayName = "AccordionContent";

type AccordionFullItemProps = {
	title: string;
	children?: React.ReactNode;
};

function AccordionFullItem({ title, children }: AccordionFullItemProps) {
	const val = React.useId();

	return (
		<>
			<AccordionItem
				value={val}
				className="data-[state=closed]:border-b-2 data-[state=closed]:border-gray-200 data-[state=open]:border-b-0"
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

export { AccordionContent, AccordionFullItem, AccordionItem, AccordionTrigger };
export type { AccordionFullItemProps };
