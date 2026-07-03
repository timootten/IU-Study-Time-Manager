import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const runtimeBaseURL =
	typeof window !== "undefined"
		? window.location.origin
		: import.meta.env.VITE_APP_URL;

export const authClient = createAuthClient({
	baseURL: runtimeBaseURL,
	basePath: "/api/auth",
	plugins: [adminClient()],
});
