import { Button, type ButtonProps } from "@/components/ui/button";
import type { Position } from "@/shared/position";
import type { ReactNode } from "@tanstack/react-router";

interface Props extends ButtonProps {
	icon: ReactNode;
	position?: Position;
}
export function IconButton({ icon, position = "end", ...props }: Props) {
	return (
		<Button {...props}>
			{position === "start" && icon}
			{props.children}
			{position === "end" && icon}
		</Button>
	);
}
