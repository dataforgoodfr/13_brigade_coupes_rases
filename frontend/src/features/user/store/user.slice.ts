import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
	type LoginRequest,
	type TokenResponse,
	tokenSchema,
	type User,
	type UserResponse,
	userResponseSchema,
	userSchema,
} from "@/features/user/store/user";
import type { RequestedContent } from "@/shared/api/types";
import { useAppSelector } from "@/shared/hooks/store";
import { selectDepartmentsByIds } from "@/shared/store/referential/referential.slice";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import { createAppAsyncThunk } from "@/shared/store/thunk";

const TOKEN_KEY = "token";

export function setStoredToken(token: TokenResponse | undefined) {
	if (token) {
		localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
	} else {
		localStorage.removeItem(TOKEN_KEY);
	}
}
export function getStoredToken(): TokenResponse | undefined {
	const token = localStorage.getItem(TOKEN_KEY);
	if (token !== null) {
		return tokenSchema.safeParse(JSON.parse(token)).data;
	}
}

export const loginThunk = createAppAsyncThunk(
	"users/login",
	async (loginRequest: LoginRequest, { extra: { api }, dispatch }) => {
		const formData = new FormData();
		formData.append("username", loginRequest.email);
		formData.append("password", loginRequest.password);
		setStoredToken(undefined);

		const tokenResult = await api()
			.post<TokenResponse>("api/v1/token", { body: formData })
			.json();
		const tokenResponse = tokenSchema.parse(tokenResult);

		setStoredToken(tokenResponse);
		dispatch(getMeThunk());
	},
);

export const getMeThunk = createAppAsyncThunk(
	"users/getMe",
	async (_, { getState, extra: { api } }) => {
		const userResult = await api().get<UserResponse>("api/v1/me").json();
		const user = userResponseSchema.parse(userResult);
		const departments = selectDepartmentsByIds(
			getState(),
			user.departments ?? [],
		);
		return userSchema.parse({ ...user, departments });
	},
);

export const userSlice = createSlice({
	name: "user",
	initialState: { status: "idle" } as RequestedContent<User>,
	reducers: {
		setUser: (state, { payload: user }: PayloadAction<User>) => {
			state.value = user;
			state.status = "success";
		},
		logoutUser: (state) => {
			state.value = undefined;
			state.status = "idle";
			setStoredToken(undefined);
		},
	},
	extraReducers: (builder) => {
		builder.addCase(getMeThunk.fulfilled, (state, { payload: user }) => {
			state.status = "success";
			state.value = user;
		});
		builder.addCase(getMeThunk.rejected, (state, { error }) => {
			state.status = "error";
			state.error = error;
		});
		builder.addCase(getMeThunk.pending, (state) => {
			state.status = "loading";
		});
	},
});
const selectState = (state: RootState) => state.user;
const selectLoggedUser = createTypedDraftSafeSelector(
	selectState,
	(user) => user.value,
);

export const useLoggedUser = () => useAppSelector(selectLoggedUser);
