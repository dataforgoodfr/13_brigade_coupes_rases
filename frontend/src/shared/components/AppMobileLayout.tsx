import { Outlet } from "@tanstack/react-router"

import { MobileNavbar } from "@/shared/components/MobileNavbar"

export function AppMobileLayout() {
	return (
		<div className="sm:hidden h-[100dvh] flex flex-col justify-content-between">
			<div className="flex grow mb-12 overflow-auto">
				<Outlet />
			</div>
			<MobileNavbar />
		</div>
	)
}
