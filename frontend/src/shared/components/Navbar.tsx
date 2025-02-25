import canopeeWhiteIcon from "@/assets/canopee_icon-blanc-simplifiee-rvb.png";
import homeIcon from "@/assets/home-icon.svg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { selectLoggedUser, userSlice } from "@/features/user/store/user.slice";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import {
	DropdownMenu,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";

export function Navbar() {
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
		<nav className="flex flex-col item-center gap-16 bg-[#204933] shadow z-max min-w-20 max-w-20 overflow-visible">
			<img
				alt="Canopée"
				src={canopeeWhiteIcon}
				className="h-auto w-auto aspect-square object-cover mt-6 mx-4"
			/>
			<div className="flex flex-col gap-10 items-center">
				<Link to="/map/list">
					<img
						alt="Accueil"
						src={homeIcon}
						className="h-8 w-auto aspect-square object-fill"
					/>
				</Link>
				{!user && (
					<Link
						to="/login"
						activeProps={{
							className: "border-green-500  text-gray-900",
						}}
						inactiveProps={{
							className:
								"border-transparent  text-gray-500 hover:border-gray-300 hover:text-gray-700",
						}}
						className="inline-flex items-center border-b-2 h-full px-1 pt-1 text-sm font-medium "
					>
						Connexion
					</Link>
				)}
			</div>
			{user && (
				<DropdownMenu data-testid="dropdown-menu-login">
					<DropdownMenuTrigger asChild>
						{user?.avatarUrl && (
							<Avatar>
								<AvatarImage alt="Avatar" src={user.avatarUrl} />
								<AvatarFallback>{user.login}</AvatarFallback>
							</Avatar>
						)}
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-56 z-90">
						<DropdownMenuLabel>Mon compte</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={handleLogout}>
							Déconnexion
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</nav>
	);
}
