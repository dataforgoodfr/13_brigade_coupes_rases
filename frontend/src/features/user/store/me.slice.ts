import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
	type CredentialError,
	credentialErrorSchema,
	type LoginRequest,
	type Me,
	type MeError,
	type MeResponse,
	meErrorSchema,
	meResponseSchema,
	meSchema,
	type TokenResponse,
	tokenSchema,
	type UpdateMeRequest,
} from "@/features/user/store/me";
import { setIdle } from "@/shared/api/api";
import type { RequestedContent } from "@/shared/api/types";
import { useAppSelector } from "@/shared/hooks/store";
import { selectDepartmentsByIds } from "@/shared/store/referential/referential.slice";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import {
	addRequestedContentCases,
	createAppAsyncThunk,
} from "@/shared/store/thunk";

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
		const userResult = await api().get<MeResponse>("api/v1/me").json();
		const user = meResponseSchema.parse(userResult);
		const departments = selectDepartmentsByIds(
			getState(),
			user.departments ?? [],
		);
		return meSchema.parse({ ...user, departments });
	},
);
export const addFavoriteThunk = createAppAsyncThunk<void, string>(
	"users/addFavorite",
	async (favorite, { getState, extra: { api }, dispatch }) => {
		const { favorites } = selectMe(getState()) as Me;
		await api().put("api/v1/me", {
			json: { favorites: [...favorites, favorite] } satisfies UpdateMeRequest,
		});
		dispatch(getMeThunk());
	},
);
export const removeFavoriteThunk = createAppAsyncThunk<void, string>(
	"users/removeFavorite",
	async (favorite, { getState, extra: { api }, dispatch }) => {
		const { favorites } = selectMe(getState()) as Me;
		await api().put("api/v1/me", {
			json: {
				favorites: favorites.filter((id) => id !== favorite),
			} satisfies UpdateMeRequest,
		});
		dispatch(getMeThunk());
	},
);
type State = {
	me: RequestedContent<Me, MeError>;
	login: RequestedContent<void, CredentialError>;
	updateMe: RequestedContent<void, MeError>;
};
const initialState: State = {
	login: { status: "idle" },
	me: { status: "idle" },
	updateMe: { status: "idle" },
};
export const meSlice = createSlice({
	name: "me",
	initialState,
	reducers: {
		setUser: (state, { payload: user }: PayloadAction<Me>) => {
			state.me.value = user;
			state.me.status = "success";
		},
		logoutUser: (state) => {
			state.me.value = undefined;
			state.me.status = "idle";
			setStoredToken(undefined);
		},
		resetLogin: (state) => {
			setIdle(state.login);
		},
	},
	extraReducers: (builder) => {
		addRequestedContentCases(builder, getMeThunk, (state) => state.me, {
			errorSchema: meErrorSchema,
		});
		addRequestedContentCases(builder, loginThunk, (state) => state.login, {
			errorSchema: credentialErrorSchema,
		});
		addRequestedContentCases(
			builder,
			addFavoriteThunk,
			(state) => state.updateMe,
			{ errorSchema: credentialErrorSchema },
		);
	},
});
const selectState = (state: RootState) => state.me;
const selectMe = createTypedDraftSafeSelector(
	selectState,
	(user) => user.me.value,
);
export const selectLogin = createTypedDraftSafeSelector(
	selectState,
	(state) => state.login,
);
export const useMe = () => useAppSelector(selectMe);
