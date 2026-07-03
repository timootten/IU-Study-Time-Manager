import type { SessionStatus } from "../types";

/**
 * Derive the display status of a session based on its start/end times
 * relative to the current moment.
 */
export function getSessionStatus(
	session: { startTime: Date | null; endTime: Date | null },
	now: Date,
): SessionStatus {
	if (session.startTime && session.endTime) {
		if (session.endTime.getTime() <= now.getTime()) return "completed";
		if (session.startTime.getTime() <= now.getTime()) return "active";
		return "planned";
	}

	if (session.startTime && !session.endTime) return "active";

	return "planned";
}
