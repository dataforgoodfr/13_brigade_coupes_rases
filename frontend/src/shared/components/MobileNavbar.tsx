import { useRouterState } from "@tanstack/react-router"
import { ListIcon, LogIn, Map as MapIcon, Settings, User } from "lucide-react"

import { useLayout } from "@/features/clear-cut/components/Layout.context"
import { useConnectedMe } from "@/features/user/store/me.slice"
import { MobileNavbarLink } from "@/shared/components/MobileNavbarLink"

export function MobileNavbar() {
	const user = useConnectedMe()
	const { layout, setLayout } = useLayout()
	const location = useRouterState({ select: (s) => s.location })

	// Boolean to know if route matcher **clear-cuts**
	const isOnClearCutsRoute = location.pathname.startsWith("/clear-cuts")

	return (
		<nav className="flex sm:hidden items-center shadow justify-around fixed bottom-0 left-0 right-0 bg-white z-[150] border-t h-16 pb-[env(safe-area-inset-bottom)]">
			<div className="flex items-center justify-around w-full h-full">
				<MobileNavbarLink
					to="/clear-cuts"
					label="Carte"
					Icon={MapIcon}
					title="Carte"
					onClick={() => setLayout("map")}
					forceActive={isOnClearCutsRoute && layout === "map"}
				/>
				<MobileNavbarLink
					to="/clear-cuts"
					label="Liste"
					Icon={ListIcon}
					title="Liste"
					onClick={() => setLayout("list")}
					forceActive={isOnClearCutsRoute && layout === "list"}
				/>
				{user && (
					<MobileNavbarLink
						to="/my-cuts"
						label="Mes Coupes"
						Icon={User}
						title="Mes Coupes"
					/>
				)}
				{user?.role === "admin" && (
					<MobileNavbarLink
						to="/administration"
						label="Paramètres"
						Icon={Settings}
						title="Paramètres"
					/>
				)}
				{!user && (
					<MobileNavbarLink
						to="/login"
						label="Connexion"
						Icon={LogIn}
						title="Connexion"
					/>
				)}
			</div>
		</nav>
	)
}
