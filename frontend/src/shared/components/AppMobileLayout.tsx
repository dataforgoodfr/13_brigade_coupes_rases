import { MobileNavbar } from "@/shared/components/MobileNavbar";
import { Outlet } from "@tanstack/react-router";

export function AppMobileLayout() {
	return (
		<div className="sm:hidden flex h-screen flex-col justify-content-between">
			<div className="flex grow h-0">
				<Outlet />
			</div>
			<MobileNavbar />
		</div>
	);
}
