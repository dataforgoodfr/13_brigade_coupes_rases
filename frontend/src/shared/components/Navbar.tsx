import canopeeWhiteIcon from "@/assets/canopee_icon-blanc-simplifiee-rvb.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { NavbarItems } from "@/features/admin/components/navbar/NavbarItems";
import { selectLoggedUser, userSlice } from "@/features/user/store/user.slice";
import { NavbarLink } from "@/shared/components/NavbarLink";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import {
	DropdownMenu,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { useNavigate, useRouter } from "@tanstack/react-router";
import clsx from "clsx";

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
				"flex flex-col item-center gap-16 bg-[#204933] shadow z-max min-w-20 max-w-20",
			)}
		>
			<img
				alt="Canopée"
				src={canopeeWhiteIcon}
				className="h-auto w-auto aspect-square object-cover mt-6 mx-4"
			/>
			<div className="flex flex-col gap-10 items-center">
				<img
					alt="Canopée"
					src={canopeeWhiteIcon}
					className="h-auto w-auto aspect-square object-cover mt-6 mx-4"
				/>
				<div className="flex grow h-full">
					<NavbarLink to="/clear-cuttings/map">Coupes rases</NavbarLink>
					{!user && <NavbarLink to="/login">Connexion</NavbarLink>}

					{user?.role === "administrator" && <NavbarItems />}
				</div>
				{user && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							{user?.avatarUrl && (
								<Avatar>
									<AvatarImage alt="Avatar" src={user.avatarUrl} />
									<AvatarFallback>{user.login}</AvatarFallback>
								</Avatar>
							)}
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-56">
							<DropdownMenuLabel>Mon compte</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleLogout}>
								Déconnexion
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</nav>
	);
}
