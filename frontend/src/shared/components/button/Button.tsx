import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { Position } from "@/shared/layout";

export interface IconButtonProps extends ButtonProps {
	icon: ReactNode;
	position?: Position;
}
export function IconButton({
	icon,
	position = "end",
	...props
}: IconButtonProps) {
	return (
		<Button {...props}>
			{position === "start" && icon}
			{props.children}
			{position === "end" && icon}
		</Button>
	);
}
