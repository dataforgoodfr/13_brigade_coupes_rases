import ky from "ky";
export const UNAUTHORIZED_ERROR_NAME = "Unauthorized";
export const api = ky.extend({
	prefixUrl: import.meta.env.VITE_API,
	hooks: {
		beforeError: [
			(error) => {
				const { response } = error;
				if (response.status === 401) {
					error.name = UNAUTHORIZED_ERROR_NAME;
				}
				return error;
			},
		],
	},
});
