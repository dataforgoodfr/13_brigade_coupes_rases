import { Outlet } from "@tanstack/react-router"

import { Navbar } from "./Navbar"

export function AppLayout() {
	return (
		<div className="sm:flex hidden h-screen ">
			<Navbar />
			<Outlet />
		</div>
	)
}
