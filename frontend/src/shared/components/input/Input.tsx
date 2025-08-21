import clsx from "clsx";
import {
	type ComponentProps,
	type ComponentPropsWithRef,
	forwardRef,
	type PropsWithChildren,
	type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type Props = {
	suffix?: ReactNode;
	prefix?: ReactNode;
} & Omit<ComponentProps<"input">, "prefix">;

type InputAsideProps = { className: string } & PropsWithChildren;
const InputAside = ({ children, className }: InputAsideProps) => {
	return (
		<span className={clsx(className, "absolute h-full flex items-center z-5")}>
			{children}
		</span>
	);
};
export const Input = forwardRef<HTMLInputElement, Props>(
	({ className, type, suffix, prefix, id, ...props }, ref) => {
		return (
			<div className="flex grow relative items-center">
				{prefix && <InputAside className="left-0">{prefix}</InputAside>}
				<input
					id={id}
					type={type}
					className={cn(
						"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						className,
					)}
					ref={ref}
					{...props}
				/>
				{suffix && <InputAside className="right-0">{suffix}</InputAside>}
			</div>
		);
	},
);
Input.displayName = "Input";

export type InputProps = ComponentPropsWithRef<typeof Input>;
