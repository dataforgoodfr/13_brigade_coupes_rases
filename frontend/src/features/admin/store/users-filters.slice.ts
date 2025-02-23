import { FiltersRequest } from "@/features/admin/store/users-schemas";
import { Role } from "@/features/user/store/user";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

export type Region = {
  code: string;
  nom: string;
};

interface FiltersState {
  name: string;
  role: Role | "all";
  regions: Region[];
}
const initialState: FiltersState = {
  name: "",
  role: "all",
  regions: [],
};
export const usersFiltersSlice = createSlice({
  initialState,
  name: "usersFilters",
  reducers: {
    setName: (state, { payload }: PayloadAction<string>) => {
      state.name = payload;
    },
    setRole: (state, { payload }: PayloadAction<Role | "all">) => {
      state.role = payload;
    },
    toggleRegion: (state, { payload }: PayloadAction<Region>) => {
      const regionIdx = state.regions.findIndex((r) => r.code === payload.code);

      if (regionIdx === -1) {
        state.regions.push(payload);
      } else {
        state.regions.splice(regionIdx, 1);
      }
    },
  },
});

export const {
  actions: { setName, setRole, toggleRegion },
} = usersFiltersSlice;

const selectState = (state: RootState) => state.usersFilters;
export const selectFiltersRequest = createTypedDraftSafeSelector(
  selectState,
  ({ name, role, regions }): FiltersRequest | undefined => {
    return {
      name,
      role: role === "all" ? undefined : role,
      regions: regions.map((r) => r.nom),
    };
  }
);

export const selectName = createTypedDraftSafeSelector(
  selectState,
  (state) => state.name
);

export const selectRole = createTypedDraftSafeSelector(
  selectState,
  (state) => state.role
);

export const selectRegions = createTypedDraftSafeSelector(
  selectState,
  (state) => state.regions
);
