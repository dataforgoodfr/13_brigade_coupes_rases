import type { PropsWithChildrenClassName } from "@/shared/types/props";
import clsx from "clsx";

export function Hint({ children, className }: PropsWithChildrenClassName) {
	return <p className={clsx(className, "text-sm text-zinc-500")}>{children}</p>;
}
