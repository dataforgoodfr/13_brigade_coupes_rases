import { Input, type InputProps } from "@/shared/components/input/Input";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { forwardRef, useState } from "react";

const iconClassName = "h-full text-secondary mr-2 ";
export const PasswordInput = forwardRef<
	HTMLInputElement,
	Omit<InputProps, "type">
>(({ ...props }, ref) => {
	const [showPassword, setShowPassword] = useState(false);
	return (
		<div className="flex relative">
			<Input
				type={showPassword ? "text" : "password"}
				autoComplete="current-password"
				ref={ref}
				{...props}
				suffix={
					!showPassword ? (
						<EyeOffIcon
							className={iconClassName}
							onClick={() => setShowPassword(true)}
						/>
					) : (
						<EyeIcon
							className={iconClassName}
							onClick={() => setShowPassword(false)}
						/>
					)
				}
			/>
		</div>
	);
});
