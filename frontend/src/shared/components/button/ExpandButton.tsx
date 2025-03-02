import { Button, type ButtonProps } from "@/shared/components/button/Button";
import { ExpandChevron } from "@/shared/components/button/ExpandChevron";
import clsx from "clsx";
import { forwardRef } from "react";

type Props = ButtonProps & {
	open: boolean;
	onOpenChanged?: (isOpen: boolean) => void;
};

export const ExpandButton = forwardRef<HTMLButtonElement, Props>(
	(
		{ open, children, variant, className, onOpenChanged, ...props },
		forwardedRef,
	) => {
		return (
			<Button
				variant={variant ?? "outline"}
				aria-expanded={open}
				{...props}
				onClick={(e) => {
					props.onClick?.(e);
					onOpenChanged?.(!open);
				}}
				className={clsx(className, "rounded-full text-primary border-primary")}
				ref={forwardedRef}
			>
				{children} <ExpandChevron open={open} />
			</Button>
		);
	},
);
