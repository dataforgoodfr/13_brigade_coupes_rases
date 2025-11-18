import {
	combineReducers,
	configureStore,
	createListenerMiddleware,
	isRejected,
} from "@reduxjs/toolkit";
import type { KyOptions } from "node_modules/ky/distribution/types/options";
import { rulesSlice } from "@/features/admin/store/rules.slice";
import { usersSlice } from "@/features/admin/store/users.slice";
import { usersFiltersSlice } from "@/features/admin/store/users-filters.slice";
import { clearCutsSlice } from "@/features/clear-cut/store/clear-cuts-slice";
import { filtersSlice } from "@/features/clear-cut/store/filters.slice";
import { usersApi } from "@/features/user/store/api";
import {
	getStoredToken,
	meSlice,
	setStoredToken,
} from "@/features/user/store/me.slice";
import { api, UNAUTHORIZED_ERROR_NAME } from "@/shared/api/api";
import { referentialSlice } from "@/shared/store/referential/referential.slice";

const unauthorizedMiddleware = createListenerMiddleware();
unauthorizedMiddleware.startListening({
	predicate: (action) => isRejected(action),
	effect: (action) => {
		if (action.error.name === UNAUTHORIZED_ERROR_NAME) {
			setStoredToken(undefined);
		}
	},
});

const reducer = combineReducers({
	[filtersSlice.reducerPath]: filtersSlice.reducer,
	[rulesSlice.reducerPath]: rulesSlice.reducer,
	[usersApi.reducerPath]: usersApi.reducer,
	[referentialSlice.reducerPath]: referentialSlice.reducer,
	[clearCutsSlice.reducerPath]: clearCutsSlice.reducer,
	[meSlice.reducerPath]: meSlice.reducer,
	// Admin reducers
	[usersFiltersSlice.reducerPath]: usersFiltersSlice.reducer,
	[usersSlice.reducerPath]: usersSlice.reducer,
});
export const setupStore = (preloadedState?: Partial<RootState>) =>
	configureStore({
		reducer,
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware({
				thunk: {
					extraArgument: {
						api: (options: KyOptions = {}) => {
							const token = getStoredToken();
							if (token) {
								return api.extend({
									...options,
									headers: {
										Authorization: `Bearer ${token.accessToken}`,
									},
								});
							}
							return api.extend(options);
						},
					},
				},
			})
				// .concat(logger)
				.concat(unauthorizedMiddleware.middleware)
				.concat(usersApi.middleware),
		preloadedState,
	});

export const store = setupStore();
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof reducer>;
export type AppStore = ReturnType<typeof setupStore>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = AppStore["dispatch"];
