import type { PropsWithChildrenClassName } from "@/shared/types/props";
import clsx from "clsx";

export function Title({ children, className }: PropsWithChildrenClassName) {
	return (
		<h1 className={clsx(className, "text-2xl font-extrabold font-[Manrope]")}>
			{children}
		</h1>
	);
}
