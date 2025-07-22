import { Hint } from "@/shared/components/typo/Hint";
import type { PropsWithChildrenClassName } from "@/shared/types/props";
import clsx from "clsx";
import type { ReactNode } from "react";

export type RuleLayoutProps = {
	label: ReactNode;
	hint: ReactNode;
	inputId: string;
} & PropsWithChildrenClassName;
export function RuleLayout({
	label,
	className,
	inputId,
	children,
	hint,
}: RuleLayoutProps) {
	return (
		<div className={clsx(className, "flex flex-col gap-1")}>
			<label htmlFor={inputId}>{label}</label>
			<Hint>{hint}</Hint>
			{children}
		</div>
	);
}
