import { Bookmark, House, Settings } from "lucide-react";
import { useConnectedMe } from "@/features/user/store/me.slice";
import { MobileNavbarLink } from "@/shared/components/MobileNavbarLink";

export function MobileNavbar() {
	const user = useConnectedMe();

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
				{user?.role === "admin" && (
					<MobileNavbarLink
						to="/administration"
						label="Paramètres"
						Icon={Settings}
						title="Paramètres"
					/>
				)}
			</div>
		</nav>
	);
}
