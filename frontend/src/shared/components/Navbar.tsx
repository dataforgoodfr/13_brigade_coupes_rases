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
        "fixed flex top-0 bg-white shadow w-full items-center"
      )}
    >
      <img
        alt="Canopée"
        src="https://www.canopee.ong/wp-content/uploads/2023/08/logo-canopee.png"
        className="h-8 w-auto px-6 "
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
    </nav>
  );
}
