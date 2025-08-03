import clsx from "clsx";
import type { PropsWithChildrenClassName } from "@/shared/types/props";

export function Title({ children, className }: PropsWithChildrenClassName) {
	return (
		<h1 className={clsx(className, "text-2xl font-extrabold font-[Manrope]")}>
			{children}
		</h1>
	);
}
