import { adminApi } from "@/features/admin/store/api";
import { usersFiltersSlice } from "@/features/admin/store/users-filters.slice";
import { clearCutsSlice } from "@/features/clear-cut/store/clear-cuts-slice";
import { filtersSlice } from "@/features/clear-cut/store/filters.slice";
import { usersApi } from "@/features/user/store/api";
import {
	getStoredToken,
	setStoredToken,
	userSlice,
} from "@/features/user/store/user.slice";
import { UNAUTHORIZED_ERROR_NAME, api } from "@/shared/api/api";
import { referentialSlice } from "@/shared/store/referential/referential.slice";
import {
	combineReducers,
	configureStore,
	createListenerMiddleware,
	isRejected,
} from "@reduxjs/toolkit";
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
	[usersApi.reducerPath]: usersApi.reducer,
	[referentialSlice.reducerPath]: referentialSlice.reducer,
	[clearCutsSlice.reducerPath]: clearCutsSlice.reducer,
	[userSlice.reducerPath]: userSlice.reducer,
	// Admin reducers
	[adminApi.reducerPath]: adminApi.reducer,
	[usersFiltersSlice.reducerPath]: usersFiltersSlice.reducer,
});
export const setupStore = (preloadedState?: Partial<RootState>) =>
	configureStore({
		reducer,
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware({
				thunk: {
					extraArgument: {
						api: () => {
							const token = getStoredToken();
							if (token) {
								return api.extend({
									headers: {
										Authorization: `Bearer ${token.access_token}`,
									},
								});
							}
							return api;
						},
					},
				},
			})
				.concat(unauthorizedMiddleware.middleware)
				.concat(usersApi.middleware)
				.concat(adminApi.middleware),
		preloadedState,
	});

export const store = setupStore();
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof reducer>;
export type AppStore = ReturnType<typeof setupStore>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = AppStore["dispatch"];
