import { Input, type InputProps } from "@/shared/components/input/Input";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { forwardRef, useState } from "react";

const iconClassName = "absolute right-0 mr-2 h-full text-secondary z-5";
export const PasswordInput = forwardRef<
	HTMLInputElement,
	Omit<InputProps, "type">
>(({ ...props }, ref) => {
	const [showPassword, setShowPassword] = useState(false);
	return (
		<div className="flex relative">
			<Input type={showPassword ? "text" : "password"} ref={ref} {...props} />
			{!showPassword ? (
				<EyeOffIcon
					className={iconClassName}
					onClick={() => setShowPassword(true)}
				/>
			) : (
				<EyeIcon
					className={iconClassName}
					onClick={() => setShowPassword(false)}
				/>
			)}
		</div>
	);
});
