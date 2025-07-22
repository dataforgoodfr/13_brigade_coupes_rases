import { NavbarItem } from "@/shared/components/NavbarItem";
import { SettingsIcon } from "lucide-react";

export const NavbarItems: React.FC = () => {
	return (
		<>
			<NavbarItem
				type="link"
				to="/administration"
				Icon={SettingsIcon}
				title="Administration"
			/>
		</>
	);
};
