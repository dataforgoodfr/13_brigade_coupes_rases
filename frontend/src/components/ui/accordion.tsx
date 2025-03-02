import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { Accordion } from "radix-ui";
import * as React from "react";

const AccordionItem = React.forwardRef<
	React.ComponentRef<typeof Accordion.Item>,
	React.ComponentPropsWithoutRef<typeof Accordion.Item>
>(({ children, className, ...props }, forwardedRef) => (
	<Accordion.Item
		className={cn(
			"mt-px overflow-hidden first:mt-0 first:rounded-t-(--radius-sm) last:rounded-b-(--radius-sm) focus-within:relative focus-within:z-10 focus-within:shadow-[0_0_0_2px]",
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

export { AccordionContent, AccordionItem, AccordionTrigger };
