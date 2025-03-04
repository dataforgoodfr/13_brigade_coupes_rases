import type { ButtonProps } from "@/components/ui/button";
import { IconButton } from "@/shared/components/button/Button";
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
			<IconButton
				variant={variant ?? "outline"}
				aria-expanded={open}
				{...props}
				onClick={(e) => {
					props.onClick?.(e);
					onOpenChanged?.(!open);
				}}
				className={clsx(className, "rounded-full text-primary border-primary")}
				ref={forwardedRef}
				icon={<ExpandChevron open={open} />}
				position="end"
			>
				{children}
			</IconButton>
		);
	},
);
