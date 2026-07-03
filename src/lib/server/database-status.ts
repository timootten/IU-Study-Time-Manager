import { createServerFn } from "@tanstack/react-start";

import { getDatabaseHealth } from "#/db";
import { DEFAULT_SERVICE_UNAVAILABLE_MESSAGE } from "#/lib/errors/service-unavailable";

export interface DatabaseStatusPayload {
	available: boolean;
	message: string;
	checkedAt: string;
}

const fallbackStatus: DatabaseStatusPayload = {
	available: false,
	message: DEFAULT_SERVICE_UNAVAILABLE_MESSAGE,
	checkedAt: new Date(0).toISOString(),
};

export const getDatabaseStatus = createServerFn({ method: "GET" }).handler(
	async () => {
		const health = await getDatabaseHealth({ source: "request" }).catch(
			() => fallbackStatus,
		);

		return {
			available: health.available,
			message: health.available ? "All systems operational." : health.message,
			checkedAt: health.checkedAt,
		} satisfies DatabaseStatusPayload;
	},
);
