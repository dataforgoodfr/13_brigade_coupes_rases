import { MobileNavbarLink } from "@/shared/components/MobileNavbarLink";
import clsx from "clsx";
import { Bookmark, House, Settings } from "lucide-react";

type Props = { className: string };
export function MobileNavbar({ className }: Props) {
	return (
		<nav
			className={clsx(
				"flex h-10 sm:hidden py-1 items-center shadow justify-around ",
				className,
			)}
		>
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
