import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import type { Router } from "@/shared/router";

interface Props extends ComponentProps<typeof Link<Router>> {
	Icon: LucideIcon;
	label: string;
}
export const MobileNavbarLink: React.FC<Props> = ({
	Icon,
	label,
	...props
}) => {
	return (
		<Link
			{...props}
			activeProps={{
				className: " text-primary",
			}}
			inactiveProps={{
				className:
					"border-zinc-500  text-gray-500 hover:border-gray-300 hover:text-gray-700",
			}}
			className="flex flex-col  items-center h-full px-1 pt-1 text-sm font-medium "
		>
			<Icon className="size-9 " />
			{label}
		</Link>
	);
};
