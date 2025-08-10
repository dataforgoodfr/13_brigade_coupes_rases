import { forwardRef } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

export const ResetButton = forwardRef<HTMLButtonElement, ButtonProps>(
	({ ...props }: Omit<ButtonProps, "variant">, ref) => (
		<Button {...props} ref={ref} variant={"destructive"}>
			Réinitialiser
		</Button>
	),
);
