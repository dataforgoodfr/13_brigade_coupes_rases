import { useRouterState } from "@tanstack/react-router"
import { House, ListIcon, LogIn, LogOutIcon, Settings } from "lucide-react"

import { useLayout } from "@/features/clear-cut/components/Layout.context"
import { useConnectedMe } from "@/features/user/store/me.slice"
import { MobileNavbarLink } from "@/shared/components/MobileNavbarLink"
import { useLogout } from "@/shared/hooks/auth"

export function MobileNavbar() {
	const user = useConnectedMe()
	const handleLogout = useLogout()
	const { layout, setLayout } = useLayout()
	const location = useRouterState({ select: (s) => s.location })

	// Boolean to know if route matcher **clear-cuts**
	const isOnClearCutsRoute = location.pathname.startsWith("/clear-cuts")

	return (
		<nav className="flex sm:hidden py-1 items-center shadow justify-around fixed bottom-0 left-0 right-0 bg-white z-150 border-t h-12">
			<div className="flex items-center justify-around w-full">
				<MobileNavbarLink
					to="/"
					label="Accueil"
					Icon={House}
					title="Accueil"
					onClick={() => setLayout("map")}
					forceActive={isOnClearCutsRoute && layout === "map"}
				/>
				<MobileNavbarLink
					to="/clear-cuts"
					label="Coupes"
					Icon={ListIcon}
					title="Coupes"
					onClick={() => setLayout("list")}
					forceActive={isOnClearCutsRoute && layout === "list"}
				/>
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
				{user && (
					<MobileNavbarLink
						to="/login"
						label="Déconnexion"
						Icon={LogOutIcon}
						onClick={handleLogout}
						title="Déconnexion"
					/>
				)}
			</div>
		</nav>
	)
}
