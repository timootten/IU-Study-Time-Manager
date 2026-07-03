import webpush from "web-push";
import { env } from "#/env";
import { logger } from "#/lib/server/logger";
import type { PendingNotification } from "./types";

let vapidConfigured = false;

function ensureVapid(): void {
	if (vapidConfigured) return;
	webpush.setVapidDetails(
		env.VAPID_SUBJECT,
		env.VAPID_PUBLIC_KEY,
		env.VAPID_PRIVATE_KEY,
	);
	vapidConfigured = true;
}

export interface PushSubscriptionRow {
	endpoint: string;
	p256dh: string;
	auth: string;
}

export async function sendPushNotification(
	n: PendingNotification,
	subscriptions: PushSubscriptionRow[],
): Promise<{ sent: number; failed: number }> {
	ensureVapid();

	const sessionName = n.sessionName || "Study Session";
	const displayName =
		n.goalTitle && n.sessionName
			? `${n.goalTitle} — ${n.sessionName}`
			: n.goalTitle || sessionName;
	const startTime = n.sessionStart.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
	});

	const bodyParts: string[] = [];
	if (n.leadMinutes <= 1) {
		bodyParts.push("Starting now");
	} else {
		bodyParts.push(`Starts in ${n.leadMinutes} min`);
	}
	bodyParts.push(startTime);
	if (n.durationMinutes) bodyParts.push(`${n.durationMinutes} min`);
	if (n.notes)
		bodyParts.push(n.notes.slice(0, 80) + (n.notes.length > 80 ? "…" : ""));

	const payload = JSON.stringify({
		title: n.leadMinutes <= 1 ? displayName : displayName,
		body: bodyParts.join(" · "),
		icon: "/icons/app-icon.svg",
		badge: "/icons/app-icon.svg",
		tag: `session-${n.sessionId}`,
		data: {
			url: `/dashboard/timer?sessionId=${n.sessionId}`,
			sessionId: n.sessionId,
		},
		timestamp: Date.now(),
		requireInteraction: n.leadMinutes <= 1,
	});

	let sent = 0;
	let failed = 0;

	for (const sub of subscriptions) {
		try {
			await webpush.sendNotification(
				{
					endpoint: sub.endpoint,
					keys: {
						p256dh: sub.p256dh,
						auth: sub.auth,
					},
				},
				payload,
			);
			sent++;
		} catch (error: unknown) {
			failed++;
			const statusCode = (error as { statusCode?: number }).statusCode;
			// 410 Gone / 404 Not Found → subscription expired, will be cleaned up elsewhere
			if (statusCode === 410 || statusCode === 404) {
				logger.info(
					{ endpoint: sub.endpoint, userId: n.userId, statusCode },
					"Push subscription expired, marking for cleanup",
				);
			} else {
				logger.error(
					{ err: error, endpoint: sub.endpoint, userId: n.userId },
					"Failed to send push notification",
				);
			}
		}
	}

	logger.info(
		{ sessionId: n.sessionId, userId: n.userId, sent, failed },
		"Push notifications dispatched",
	);

	return { sent, failed };
}
