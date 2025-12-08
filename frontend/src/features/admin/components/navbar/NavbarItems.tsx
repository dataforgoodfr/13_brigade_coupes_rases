import { SettingsIcon } from "lucide-react"

import { NavbarItem } from "@/shared/components/NavbarItem"

export const NavbarItems: React.FC = () => {
	return (
		<NavbarItem
			type="link"
			to="/administration"
			Icon={SettingsIcon}
			title="Administration"
		/>
	)
}
