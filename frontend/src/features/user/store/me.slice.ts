import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
	type CredentialError,
	connectedMeSchema,
	credentialErrorSchema,
	type LoginRequest,
	type Me,
	type MeError,
	type MeResponse,
	meErrorSchema,
	meResponseSchema,
	meSchema,
	type OfflineMe,
	type TokenResponse,
	tokenSchema,
	type UpdateMeRequest,
} from "@/features/user/store/me";
import { setIdle } from "@/shared/api/api";
import type { RequestedContent } from "@/shared/api/types";
import { useAppSelector } from "@/shared/hooks/store";
import { localStorageRepository } from "@/shared/localStorage";
import { selectDepartmentsByIds } from "@/shared/store/referential/referential.slice";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import {
	addRequestedContentCases,
	createAppAsyncThunk,
	withStorageActionCreator,
} from "@/shared/store/thunk";

const tokenStorage = localStorageRepository<TokenResponse>("token");
export const setStoredToken = (token: TokenResponse | undefined) =>
	tokenStorage.setToLocalStorage(token);
export const getStoredToken = () =>
	tokenStorage.getFromLocalStorage(tokenSchema);

const meStorage = localStorageRepository<OfflineMe>("me");

const getMe = () =>
	meStorage.getFromLocalStorageOrDefault(meSchema, {
		favorites: [],
	});

const saveMe = (me: OfflineMe) => {
	meStorage.setToLocalStorage(me);
};

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
	withStorageActionCreator(
		async (_, { getState, extra: { api } }) => {
			const userResult = await api().get<MeResponse>("api/v1/me").json();
			const user = meResponseSchema.parse(userResult);
			const departments = selectDepartmentsByIds(
				getState(),
				user.departments ?? [],
			);
			return meSchema.parse({ ...user, departments });
		},
		{ storage: meStorage, type: "controlled", schema: meSchema },
	),
);
export const addFavoriteThunk = createAppAsyncThunk<void, string>(
	"users/addFavorite",
	async (favorite, { getState, extra: { api }, dispatch }) => {
		const me = meSchema.parse(selectMe(getState()));
		const connectedMe = connectedMeSchema.safeParse(me);
		if (connectedMe.success) {
			await api().put("api/v1/me", {
				json: {
					favorites: [...connectedMe.data.favorites, favorite],
				} satisfies UpdateMeRequest,
			});
		} else {
			const updatedMe: OfflineMe = {
				...me,
				favorites: [...me.favorites, favorite],
			};
			saveMe(updatedMe);
		}
		dispatch(getMeThunk());
	},
);
export const removeFavoriteThunk = createAppAsyncThunk<void, string>(
	"users/removeFavorite",
	async (favorite, { getState, extra: { api }, dispatch }) => {
		const me = meSchema.parse(selectMe(getState()));
		const connectedMe = connectedMeSchema.safeParse(me);
		if (connectedMe.success) {
			await api().put("api/v1/me", {
				json: {
					favorites: connectedMe.data.favorites.filter((id) => id !== favorite),
				} satisfies UpdateMeRequest,
			});
		} else {
			const updatedMe: OfflineMe = {
				...me,
				favorites: me.favorites.filter((id) => id !== favorite),
			};
			saveMe(updatedMe);
		}

		dispatch(getMeThunk());
	},
);
type State = {
	me: RequestedContent<Me, MeError>;
	login: RequestedContent<void, CredentialError>;
	updateMe: RequestedContent<void, MeError>;
};
export const initialState: State = {
	login: { status: "idle" },
	me: { status: "idle", value: getMe() },
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
			meStorage.setToLocalStorage(undefined);
			state.me.value = getMe();
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
const selectConnectedMe = createTypedDraftSafeSelector(
	selectState,
	(state) => connectedMeSchema.safeParse(state.me.value).data,
);

const EMPTY_FAVORITES: string[] = [];
export const selectFavorites = createTypedDraftSafeSelector(
	selectMe,
	(me) => me?.favorites ?? EMPTY_FAVORITES,
);
export const selectLogin = createTypedDraftSafeSelector(
	selectState,
	(state) => state.login,
);

export const selectIsInFavorites = createTypedDraftSafeSelector(
	[selectFavorites, (_favorites, id: string) => id],
	(favorites, id) => {
		return favorites.includes(id);
	},
);
export const useMe = () => useAppSelector(selectMe);
export const useConnectedMe = () => useAppSelector(selectConnectedMe);
