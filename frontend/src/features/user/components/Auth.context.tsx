import { createContext, type ReactNode, useContext, useEffect } from "react";
import {
	getMeThunk,
	getStoredToken,
	useMe,
} from "@/features/user/store/me.slice";
import { useAppDispatch } from "@/shared/hooks/store";

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
	const user = useMe();
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
