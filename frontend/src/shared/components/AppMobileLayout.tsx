import { MobileNavbar } from "@/shared/components/MobileNavbar";
import { Outlet } from "@tanstack/react-router";

export function AppMobileLayout() {
	return (
		<div className="sm:hidden flex flex-col justify-content-between">
			<div className="h-[calc(100vh-60px)] flex">
				<Outlet />
			</div>
			<MobileNavbar className="h-15" />
		</div>
	);
}
