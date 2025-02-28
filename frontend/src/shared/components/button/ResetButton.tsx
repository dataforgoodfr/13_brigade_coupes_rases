import { Button, type ButtonProps } from "@/shared/components/button/Button";
import { forwardRef } from "react";

export const ResetButton = forwardRef<HTMLButtonElement, ButtonProps>(
	({ ...props }: Omit<ButtonProps, "variant">, ref) => (
		<Button {...props} ref={ref} variant={"destructive"}>
			Réinitialiser
		</Button>
	),
);
