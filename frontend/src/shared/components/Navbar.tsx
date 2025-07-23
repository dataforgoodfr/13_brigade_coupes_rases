import { NavbarItems } from "@/features/admin/components/navbar/NavbarItems";
import { selectLoggedUser, userSlice } from "@/features/user/store/user.slice";
import { NavbarItem } from "@/shared/components/NavbarItem";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import { useNavigate, useRouter } from "@tanstack/react-router";
import clsx from "clsx";

import canopeeWhiteIcon from "@/assets/canopee_icon-blanc-simplifiee-rvb.png";
import { House, LogIn, LogOutIcon } from "lucide-react";

interface Props {
	className?: string;
}
export function Navbar({ className }: Props) {
	const user = useAppSelector(selectLoggedUser);
	const router = useRouter();
	const navigate = useNavigate();
	const handleLogout = () => {
		dispatch(userSlice.actions.logoutUser());
		router.invalidate().finally(() => {
			navigate({ to: "/" });
		});
	};
	const dispatch = useAppDispatch();
	return (
		<nav
			className={clsx(
				className,
				"hidden sm:flex flex-col items-center bg-primary shadow z-max min-w-20 max-w-20 justify-between py-15",
			)}
		>
			<div className="flex flex-col items-center ">
				<img
					alt="Canopée"
					src={canopeeWhiteIcon}
					className="h-auto aspect-square object-cover my-7 size-11"
				/>
				<div className="flex flex-col gap-10 items-center">
					<NavbarItem type="link" to="/clear-cuts" Icon={House} title="Carte" />
				</div>
			</div>
			<div className="flex flex-col items-center gap-5 ">
				{!user && (
					<NavbarItem type="link" to="/login" Icon={LogIn} title="Connexion" />
				)}
				{user?.role === "admin" && <NavbarItems />}
				{user && (
					<NavbarItem
						Icon={LogOutIcon}
						onClick={handleLogout}
						type="button"
						title="Déconnexion"
					/>
				)}
			</div>
		</nav>
	);
}
