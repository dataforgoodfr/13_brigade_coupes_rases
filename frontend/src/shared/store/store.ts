import { adminApi } from "@/features/admin/store/api";
import { usersFiltersSlice } from "@/features/admin/store/users-filters.slice";
import { clearCuttingsSlice } from "@/features/clear-cutting/store/clear-cuttings-slice";
import { filtersSlice } from "@/features/clear-cutting/store/filters.slice";
import { usersApi } from "@/features/user/store/api";
import { userSlice } from "@/features/user/store/user.slice";
import { referentialSlice } from "@/shared/store/referential/referential.slice";
import { combineReducers, configureStore } from "@reduxjs/toolkit";

const reducer = combineReducers({
	[filtersSlice.reducerPath]: filtersSlice.reducer,
	[usersApi.reducerPath]: usersApi.reducer,
	[referentialSlice.reducerPath]: referentialSlice.reducer,
	[clearCuttingsSlice.reducerPath]: clearCuttingsSlice.reducer,
	[userSlice.reducerPath]: userSlice.reducer,
	// Admin reducers
	[adminApi.reducerPath]: adminApi.reducer,
	[usersFiltersSlice.reducerPath]: usersFiltersSlice.reducer,
});
export const setupStore = (preloadedState?: Partial<RootState>) =>
	configureStore({
		reducer,
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware()
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
