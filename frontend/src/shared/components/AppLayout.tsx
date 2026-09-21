import { Outlet } from "@tanstack/react-router"

import { Navbar } from "./Navbar"

export function AppLayout() {
	return (
		<div className="sm:flex hidden h-full overflow-hidden">
			<Navbar />
			<Outlet />
		</div>
	)
}
