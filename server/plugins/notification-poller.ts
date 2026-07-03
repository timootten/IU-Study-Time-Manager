import {
	isNotificationPollerRunning,
	startNotificationPoller,
	stopNotificationPoller,
} from "#/lib/server/notifications";
import { definePlugin } from "nitro";

export default definePlugin(() => {
	if (isNotificationPollerRunning()) return;
	startNotificationPoller();
});

// Cleanup on shutdown
if (typeof process !== "undefined") {
	process.on("SIGTERM", () => {
		stopNotificationPoller();
	});
	process.on("SIGINT", () => {
		stopNotificationPoller();
	});
}
