import { Outlet } from "@tanstack/react-router"

import { MobileNavbar } from "@/shared/components/MobileNavbar"

export function AppMobileLayout() {
	return (
		<div className="sm:hidden h-[100dvh] flex flex-col justify-content-between">
			<div className="flex grow">
				<Outlet />
			</div>
			<MobileNavbar />
		</div>
	)
}
