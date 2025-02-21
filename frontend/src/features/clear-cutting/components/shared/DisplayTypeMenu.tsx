import type { Routes } from "@/shared/router";
import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { List, Map as MapIcon } from "lucide-react";
const navigation = [
	{
		name: "List",
		to: "/clear-cuttings/list" satisfies Routes,
		icon: List,
	},
	{
		name: "Carte",
		to: "/clear-cuttings/map" satisfies Routes,
		icon: MapIcon,
	},
];

export function DisplayTypeMenu() {
	return (
		<div className="flex w-full justify-end  flex-row">
			{navigation.map((item) => (
				<Link
					key={item.to}
					to={item.to}
					activeProps={{ className: "bg-gray-100 text-green-600" }}
					inactiveProps={{
						className: "text-gray-700 hover:bg-gray-50 hover:text-green-600",
					}}
					className="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
				>
					{({ isActive }) => (
						<>
							<item.icon
								aria-hidden="true"
								className={clsx(
									isActive
										? "text-green-600"
										: "text-gray-400 group-hover:text-green-600",
									"size-6 shrink-0",
								)}
							/>
							{item.name}
						</>
					)}
				</Link>
			))}
		</div>
	);
}
