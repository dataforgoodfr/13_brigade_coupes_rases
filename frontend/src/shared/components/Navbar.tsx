import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenuContent,
	DropdownMenuItem,
} from "@/shared/components/dropdown/DropdownMenu";

import { NavbarItems } from "@/features/admin/components/navbar/NavbarItems";
import { selectLoggedUser, userSlice } from "@/features/user/store/user.slice";
import { NavbarLink } from "@/shared/components/NavbarLink";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import {
	DropdownMenu,
	DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { useNavigate, useRouter } from "@tanstack/react-router";
import clsx from "clsx";

import canopeeWhiteIcon from "@/assets/canopee_icon-blanc-simplifiee-rvb.png";
import { House, LogIn, SettingsIcon } from "lucide-react";

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
			<div className="flex flex-col items-center gap-16 ">
				<img
					alt="Canopée"
					src={canopeeWhiteIcon}
					className="h-auto aspect-square object-cover mt-6 size-11"
				/>
				<div className="flex flex-col gap-10 items-center">
					<NavbarLink to="/clear-cuts" Icon={House} title="Carte" />
					{!user && <NavbarLink to="/login" Icon={LogIn} title="Connexion" />}

					{user?.role === "admin" && <NavbarItems />}
				</div>
			</div>

			{user && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild className="size-11 ">
						<Avatar>
							<AvatarImage alt="Avatar" src={user.avatarUrl} />
							<AvatarFallback>
								<SettingsIcon />
							</AvatarFallback>
						</Avatar>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-56">
						<DropdownMenuItem onClick={handleLogout}>
							Déconnexion
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</nav>
	);
}
