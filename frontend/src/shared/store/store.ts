import { clearCuttingsApi } from "@/features/clear-cutting/store/api";
import { filtersSlice } from "@/features/clear-cutting/store/filters.slice";
import { combineReducers, configureStore } from "@reduxjs/toolkit";

const reducer = combineReducers({
	[clearCuttingsApi.reducerPath]: clearCuttingsApi.reducer,
	[filtersSlice.reducerPath]: filtersSlice.reducer,
});
export const setupStore = (preloadedState?: Partial<RootState>) =>
	configureStore({
		reducer,
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware().concat(clearCuttingsApi.middleware),
		preloadedState,
	});

export const store = setupStore();
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof reducer>;
export type AppStore = ReturnType<typeof setupStore>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = AppStore["dispatch"];
