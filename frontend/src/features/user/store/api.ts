import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const usersApi = createApi({
	reducerPath: "api/users",
	baseQuery: fetchBaseQuery({
		baseUrl: `${import.meta.env.VITE_API}/users`,
	}),
	endpoints: () => ({}),
});
