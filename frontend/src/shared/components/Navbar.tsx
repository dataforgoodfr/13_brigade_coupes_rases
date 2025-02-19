import { Link } from "@tanstack/react-router";
import clsx from "clsx";

interface Props {
	className?: string;
}
export function Navbar({ className }: Props) {
	return (
		<nav
			className={clsx(
				className,
				"fixed flex top-0 bg-white shadow w-full items-center z-max",
			)}
		>
			<img
				alt="Canopée"
				src="https://www.canopee.ong/wp-content/uploads/2023/08/logo-canopee.png"
				className="h-8 w-auto px-6 "
			/>
			<div className="flex grow h-full">
				<Link
					to="/clear-cuttings/map"
					activeProps={{
						className: "border-green-500  text-gray-900",
					}}
					inactiveProps={{
						className:
							"border-transparent  text-gray-500 hover:border-gray-300 hover:text-gray-700",
					}}
					className="inline-flex items-center border-b-2 h-full px-1 pt-1 text-sm font-medium "
				>
					Coupes rases
				</Link>
			</div>
		</nav>
	);
}
