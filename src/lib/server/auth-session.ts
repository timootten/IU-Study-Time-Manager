import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { auth } from "#/lib/auth";
import { logServerError } from "#/lib/server/logger";

export const getAuthSession = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const headers = new Headers(getRequestHeaders());
			return await auth.api.getSession({ headers });
		} catch (error) {
			logServerError("Failed to retrieve auth session", error);
			return null;
		}
	},
);
