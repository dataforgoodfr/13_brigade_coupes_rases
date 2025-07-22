import { NavbarLink } from "@/shared/components/NavbarLink";
import { ChartBarIcon, UsersIcon } from "lucide-react";

export const NavbarItems: React.FC = () => {
	return (
		<>
			<NavbarLink to="/users" Icon={UsersIcon} title="Utilisateurs" />
			<NavbarLink to="/rules" Icon={ChartBarIcon} title="Règles" />
		</>
	);
};
