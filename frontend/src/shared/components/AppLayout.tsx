import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

interface Props {
	children?: ReactNode;
}
export function AppLayout({ children }: Props) {
	return (
		<>
			<div className="flex h-screen ">
				<Navbar />
				<Outlet />
			</div>
		</>
	);
}
