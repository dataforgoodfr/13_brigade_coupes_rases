import {
	getStoredUser,
	selectLoggedUser,
	userSlice,
} from "@/features/user/store/user.slice";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import { type ReactNode, createContext, useContext, useEffect } from "react";

export type AuthContext = { isAuthenticated: boolean };
const AuthCtx = createContext<AuthContext>({
	isAuthenticated: false,
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
		const storedUser = getStoredUser();
		if (storedUser) {
			dispatch(userSlice.actions.setUser(storedUser));
		}
	}, [user, dispatch]);

	return (
		<AuthCtx.Provider value={{ isAuthenticated: user !== undefined }}>
			{children}
		</AuthCtx.Provider>
	);
}
