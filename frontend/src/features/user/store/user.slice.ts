import {
	type LoginRequest,
	type User,
	type UserResponse,
	userResponseSchema,
	userSchema,
} from "@/features/user/store/user";
import { api } from "@/shared/api/api";
import type { RequestedContent } from "@/shared/api/types";
import { selectDepartmentsByIds } from "@/shared/store/referential/referential.slice";
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
	async (loginRequest: LoginRequest, { getState }) => {
		const result = await api
			.post<UserResponse>("login", { json: loginRequest })
			.json();
		const user = userResponseSchema.parse(result);
		if (user.role === "volunteer") {
			const affectedDepartments = selectDepartmentsByIds(
				getState() as RootState,
				user.affectedDepartments ?? [],
			);
			const volunteer = userSchema.parse({ ...user, affectedDepartments });
			setStoredUser(volunteer);
			return volunteer;
		}
		return userSchema.parse(user);
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
	(user) => user.value,
);
