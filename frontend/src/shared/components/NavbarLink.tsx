import { Link, type LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type React from "react";

interface Props extends LinkProps {
	Icon: LucideIcon;
}
export const NavbarLink: React.FC<Props> = ({ Icon, ...props }) => {
	return (
		<Link
			{...props}
			activeProps={{
				className: "border-green-500  text-gray-900",
			}}
			inactiveProps={{
				className:
					"border-transparent  text-gray-500 hover:border-gray-300 hover:text-gray-700",
			}}
			className="inline-flex items-center border-b-2 h-full px-1 pt-1 text-sm font-medium "
		>
			<Icon className="text-primary-foreground size-11" />
		</Link>
	);
};
