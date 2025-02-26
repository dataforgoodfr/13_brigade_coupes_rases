import { cn } from "@/lib/utils";
import type { ReactNode } from "@tanstack/react-router";
import {
	type ComponentProps,
	type ComponentPropsWithRef,
	type PropsWithChildren,
	forwardRef,
} from "react";

type Props = {
	suffix?: ReactNode;
	prefix?: ReactNode;
} & ComponentProps<"input">;
const InputAside = ({ children }: PropsWithChildren) => {
	return (
		<span className="absolute right-0 mr-2 h-full text-secondary z-5  bg-gray-300">
			{children}
		</span>
	);
};
export const Input = forwardRef<HTMLInputElement, Props>(
	({ className, type, suffix, prefix, ...props }, ref) => {
		return (
			<div className="">
				{prefix && <InputAside>{prefix}</InputAside>}
				<input
					type={type}
					className={cn(
						"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						className,
					)}
					ref={ref}
					{...props}
				/>
				{suffix && <InputAside>{suffix}</InputAside>}
			</div>
		);
	},
);
Input.displayName = "Input";

export type InputProps = ComponentPropsWithRef<typeof Input>;
