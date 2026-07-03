import {
	DEFAULT_SERVICE_UNAVAILABLE_MESSAGE,
	ServiceUnavailableError,
} from "#/lib/errors/service-unavailable";

import { getDatabaseStatus } from "./database-status";

const UNAVAILABLE_STATUS_FALLBACK = {
	available: false,
	message: DEFAULT_SERVICE_UNAVAILABLE_MESSAGE,
	checkedAt: new Date(0).toISOString(),
};

export async function requireServiceAvailability(
	message = DEFAULT_SERVICE_UNAVAILABLE_MESSAGE,
) {
	const databaseStatus = await getDatabaseStatus().catch(
		() => UNAVAILABLE_STATUS_FALLBACK,
	);

	if (!databaseStatus.available) {
		throw new ServiceUnavailableError(message);
	}
}
