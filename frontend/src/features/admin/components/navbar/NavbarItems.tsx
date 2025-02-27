import { NavbarLink } from "@/shared/components/NavbarLink";
import { UsersIcon } from "lucide-react";

export const NavbarItems: React.FC = () => {
	return <NavbarLink to="/users" Icon={UsersIcon} title="Utilisateurs" />;
};
