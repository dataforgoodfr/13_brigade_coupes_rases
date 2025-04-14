import { MobileNavbarLink } from "@/shared/components/MobileNavbarLink";
import { Bookmark, House, Settings } from "lucide-react";

export function MobileNavbar() {
	return (
		<nav className="flex sm:hidden py-1 items-center shadow justify-around ">
			<div className="flex  items-center gap-16 ">
				<MobileNavbarLink
					to="/clear-cuts"
					label="Accueil"
					Icon={House}
					title="Accueil"
				/>
				<MobileNavbarLink
					to="/"
					label="Historique"
					Icon={Bookmark}
					title="Historique"
				/>
				<MobileNavbarLink
					to="/settings"
					label="Paramètres"
					Icon={Settings}
					title="Historique"
				/>
			</div>
		</nav>
	);
}
