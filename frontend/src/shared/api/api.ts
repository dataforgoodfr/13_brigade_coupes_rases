import ky from "ky";
export const api = ky.extend({ prefixUrl: import.meta.env.VITE_API });
