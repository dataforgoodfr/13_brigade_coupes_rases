import {
	type LoginRequest,
	type User,
	userSchema,
} from "@/features/user/store/user";
import { api } from "@/shared/api/api";
import type { RequestedContent } from "@/shared/api/types";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import {
	type PayloadAction,
	createAsyncThunk,
	createSlice,
} from "@reduxjs/toolkit";
const USER_KEY = "user";

function setStoredUser(user: User | undefined) {
	if (user) {
		localStorage.setItem(USER_KEY, JSON.stringify(user));
	} else {
		localStorage.removeItem(USER_KEY);
	}
}
export function getStoredUser(): User | undefined {
	const user = localStorage.getItem(USER_KEY);
	if (user !== null) {
		return userSchema.safeParse(JSON.parse(user)).data;
	}
}
export const loginThunk = createAsyncThunk(
	"users/login",
	async (loginRequest: LoginRequest) => {
		const result = await api.post<User>("login", { json: loginRequest }).json();
		const user = userSchema.parse(result);
		setStoredUser(user);
		return user;
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
			setStoredUser(undefined);
		},
	},
	extraReducers: (builder) => {
		builder.addCase(loginThunk.fulfilled, (state, { payload: user }) => {
			state.status = "success";
			state.value = user;
		});
		builder.addCase(loginThunk.rejected, (state, { error }) => {
			console.error(error);
			state.status = "error";
			state.error = error;
		});
		builder.addCase(loginThunk.pending, (state) => {
			state.status = "loading";
		});
	},
});
const selectState = (state: RootState) => state.user;
export const selectLoggedUser = createTypedDraftSafeSelector(
	selectState,
	(user) => userSchema.safeParse(user.value).data,
);
