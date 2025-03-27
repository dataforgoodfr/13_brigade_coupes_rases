import {
	getMeThunk,
	getStoredToken,
	selectLoggedUser,
} from "@/features/user/store/user.slice";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import { type ReactNode, createContext, useContext, useEffect } from "react";

export type AuthContext = { isAuthenticated: boolean; isAdmin: boolean };
const AuthCtx = createContext<AuthContext>({
	isAuthenticated: false,
	isAdmin: false,
});

export const useAuth = () => useContext(AuthCtx);

interface Props {
	children: ReactNode;
}

export function AuthProvider({ children }: Props) {
	const user = useAppSelector(selectLoggedUser);
	const dispatch = useAppDispatch();
	useEffect(() => {
		if (user !== undefined) {
			return;
		}
		const storedToken = getStoredToken();
		if (storedToken) {
			dispatch(getMeThunk());
		}
	}, [user, dispatch]);

	return (
		<AuthCtx.Provider
			value={{
				isAuthenticated: user !== undefined,
				isAdmin: user?.role === "admin",
			}}
		>
			{children}
		</AuthCtx.Provider>
	);
}
