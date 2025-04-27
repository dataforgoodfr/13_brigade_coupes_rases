import {
  selectPage,
  selectSize,
} from "@/features/admin/store/users-filters.slice";
import type { Users } from "@/features/admin/store/users-schemas";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import { createAppAsyncThunk } from "@/shared/store/thunk";
import { createSlice } from "@reduxjs/toolkit";
import { useMemo } from "react";

interface FiltersState {
  status: "idle" | "loading" | "success" | "error";
  users: Users[];
  metadata: {
    totalCount?: number;
    pagesCount?: number;
  };
}
const initialState: FiltersState = {
  status: "idle",
  users: [],
  metadata: {},
};

export const getUsersThunk = createAppAsyncThunk(
  "users/getUsers",
  async (params: { page: number; size: number }, { extra: { api } }) => {
    const result = await api()
      .get<{
        content: Users[];
        metadata: {
          total_count: number;
          pages_count: number;
        };
      }>("api/v1/users", {
        searchParams: {
          page: params.page,
          size: params.size,
        },
      })
      .json();

    return result;
  }
);

export const usersSlice = createSlice({
  initialState,
  name: "users",
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getUsersThunk.fulfilled, (state, { payload }) => {
      state.status = "success";
      state.users = payload.content;
      state.metadata.totalCount = payload.metadata.total_count;
      state.metadata.pagesCount = payload.metadata.pages_count;
    });
    builder.addCase(getUsersThunk.rejected, (state, _error) => {
      state.status = "error";
    });
    builder.addCase(getUsersThunk.pending, (state) => {
      state.status = "loading";
    });
  },
});

const selectState = (state: RootState) => state.users;
export const selectStatus = createTypedDraftSafeSelector(
  selectState,
  (state) => state.status
);
export const selectUsers = createTypedDraftSafeSelector(
  selectState,
  (state) => state.users
);
export const selectMetadata = createTypedDraftSafeSelector(
  selectState,
  (state) => state.metadata
);
export const useGetUsers = () => {
  const page = useAppSelector(selectPage);
  const size = useAppSelector(selectSize);

  const dispatch = useAppDispatch();

  return useMemo(() => {
    return dispatch(getUsersThunk({ page, size }));
  }, [dispatch, page, size]);
};
