import { and, eq, gte, isNotNull, lte } from "drizzle-orm";
import { db } from "#/db";
import {
	calendarImports,
	goals,
	notificationLog,
	notificationPreferences,
	pushSubscriptions,
	sessions,
	user,
} from "#/db/schema";
import { env } from "#/env";
import { logger } from "#/lib/server/logger";
import { sendEmailNotification } from "./email-sender";
import { sendPushNotification } from "./push-sender";
import type { PendingNotification } from "./types";

interface PollState {
	intervalMs: number;
	lookaheadMs: number;
	timer: ReturnType<typeof setInterval> | null;
	running: boolean;
}

const state: PollState = {
	intervalMs: env.NOTIFICATION_POLL_INTERVAL_MS,
	lookaheadMs: env.NOTIFICATION_LOOKAHEAD_MS,
	timer: null,
	running: false,
};

/**
 * Determine if a session should receive notifications.
 *
 * For ICS sessions: check `calendar_imports.notificationsEnabled`.
 * For manual sessions: check `sessions.notificationsEnabled`.
 * Both must be true. Also respects user notification preferences.
 */
function resolveEffectiveNotificationEnabled(
	sessionNotificationsEnabled: boolean,
	sessionSource: "manual" | "ics",
	importNotificationsEnabled: boolean | null,
): boolean {
	if (sessionSource === "ics") {
		// ICS sessions: import-level toggle controls
		return importNotificationsEnabled !== false; // null means no import (shouldn't happen), treat as true
	}
	// Manual sessions: session-level toggle controls
	return sessionNotificationsEnabled;
}

async function poll(): Promise<void> {
	try {
		const now = new Date();
		const lookahead = new Date(now.getTime() + state.lookaheadMs);

		// Find sessions starting within the lookahead window that haven't been
		// fully notified yet. We use a raw-ish query to join all the data we need.
		const rows = await db
			.select({
				// Session fields
				sessionId: sessions.id,
				sessionStart: sessions.startTime,
				sessionEnd: sessions.endTime,
				sessionName: sessions.name,
				sessionNotes: sessions.notes,
				sessionSource: sessions.source,
				sessionNotificationsEnabled: sessions.notificationsEnabled,
				sessionNotificationSentAt: sessions.notificationSentAt,
				sessionImportId: sessions.importId,
				// Import-level toggle
				importNotificationsEnabled: calendarImports.notificationsEnabled,
				// Goal title
				goalTitle: goals.title,
				// User fields
				userId: user.id,
				userEmail: user.email,
				// Notification preferences (nullable)
				prefEmailEnabled: notificationPreferences.emailEnabled,
				prefPushEnabled: notificationPreferences.pushEnabled,
				prefEmailLead: notificationPreferences.emailLeadMinutes,
				prefPushLead: notificationPreferences.pushLeadMinutes,
				prefQuietStart: notificationPreferences.quietHourStart,
				prefQuietEnd: notificationPreferences.quietHourEnd,
			})
			.from(sessions)
			.innerJoin(user, eq(sessions.userId, user.id))
			.leftJoin(calendarImports, eq(sessions.importId, calendarImports.id))
			.leftJoin(goals, eq(sessions.goalId, goals.id))
			.leftJoin(
				notificationPreferences,
				eq(user.id, notificationPreferences.userId),
			)
			.where(
				and(
					isNotNull(sessions.startTime),
					gte(sessions.startTime, now),
					lte(sessions.startTime, lookahead),
				),
			);

		if (rows.length === 0) return;

		let emailSent = 0;
		let pushSent = 0;
		const logInserts: (typeof notificationLog.$inferInsert)[] = [];
		const sessionUpdates: {
			id: string;
			notificationSentAt: Record<string, string>;
		}[] = [];

		for (const row of rows) {
			if (!row.sessionStart || !row.userEmail) continue;

			const effectiveEnabled = resolveEffectiveNotificationEnabled(
				row.sessionNotificationsEnabled,
				row.sessionSource,
				row.importNotificationsEnabled,
			);

			if (!effectiveEnabled) continue;

			// Skip if in quiet hours
			const nowHour = now.getHours();
			const quietStart = row.prefQuietStart;
			const quietEnd = row.prefQuietEnd;
			if (
				quietStart != null &&
				quietEnd != null &&
				isInQuietHours(nowHour, quietStart, quietEnd)
			) {
				continue;
			}

			const minutesUntilStart = Math.round(
				(row.sessionStart.getTime() - now.getTime()) / 60_000,
			);

			// Use a fresh object for tracking what we sent this tick.
			// The DB value is the source of truth for what was already sent.
			const sentThisTick: Record<string, string> = {};
			const alreadySent: Record<string, string> =
				(row.sessionNotificationSentAt as Record<string, string>) ?? {};

			// Build notification payload
			const durationMinutes = row.sessionEnd
				? Math.round(
						(row.sessionEnd.getTime() - row.sessionStart.getTime()) / 60_000,
					)
				: null;

			const notification: PendingNotification = {
				sessionId: row.sessionId,
				userId: row.userId,
				userEmail: row.userEmail,
				sessionName: row.sessionName,
				goalTitle: row.goalTitle ?? null,
				sessionStart: row.sessionStart,
				durationMinutes,
				notes: row.sessionNotes,
				leadMinutes: 0, // placeholder
				source: row.sessionSource,
				importId: row.sessionImportId,
			};

			// ── Email ──────────────────────────────────────────────
			const emailEnabled = row.prefEmailEnabled !== false; // default ON
			const emailLead = row.prefEmailLead ?? 30;
			const emailKey = `email_${emailLead}`;

			if (
				emailEnabled &&
				!alreadySent[emailKey] &&
				minutesUntilStart <= emailLead &&
				minutesUntilStart > -5 // don't notify for already-passed sessions
			) {
				notification.leadMinutes = emailLead;
				const success = await sendEmailNotification(notification);
				sentThisTick[emailKey] = new Date().toISOString();
				logInserts.push({
					userId: row.userId,
					sessionId: row.sessionId,
					channel: "email",
					status: success ? "sent" : "failed",
					leadMinutes: emailLead,
				});
				if (success) emailSent++;
			}

			// ── Push ───────────────────────────────────────────────
			const pushEnabled = row.prefPushEnabled !== false; // default ON
			const pushLead = row.prefPushLead ?? 5;
			const pushKey = `push_${pushLead}`;

			if (
				pushEnabled &&
				!alreadySent[pushKey] &&
				minutesUntilStart <= pushLead &&
				minutesUntilStart > -5
			) {
				// Fetch push subscriptions for this user
				const subs = await db
					.select({
						endpoint: pushSubscriptions.endpoint,
						p256dh: pushSubscriptions.p256dh,
						auth: pushSubscriptions.auth,
					})
					.from(pushSubscriptions)
					.where(eq(pushSubscriptions.userId, row.userId));

				if (subs.length > 0) {
					notification.leadMinutes = pushLead;
					const result = await sendPushNotification(notification, subs);
					sentThisTick[pushKey] = new Date().toISOString();
					logInserts.push({
						userId: row.userId,
						sessionId: row.sessionId,
						channel: "push",
						status: result.sent > 0 ? "sent" : "failed",
						leadMinutes: pushLead,
					});
					pushSent += result.sent;
				}
			}

			// Persist the sent keys back to the DB
			if (Object.keys(sentThisTick).length > 0) {
				const merged: Record<string, string> = {
					...alreadySent,
					...sentThisTick,
				};
				sessionUpdates.push({
					id: row.sessionId,
					notificationSentAt: merged,
				});
			}
		}

		// Batch-write audit log
		if (logInserts.length > 0) {
			await db.insert(notificationLog).values(logInserts);
		}

		// Batch-update session notification_sent_at
		for (const update of sessionUpdates) {
			await db
				.update(sessions)
				.set({ notificationSentAt: update.notificationSentAt })
				.where(eq(sessions.id, update.id));
		}

		if (emailSent > 0 || pushSent > 0) {
			logger.info(
				{
					emailSent,
					pushSent,
					sessionsChecked: rows.length,
					sessionsNotified: sessionUpdates.length,
				},
				"Notification poll cycle complete",
			);
		}
	} catch (error) {
		logger.error({ err: error }, "Notification poller error");
	}
}

function isInQuietHours(
	hour: number,
	quietStart: number,
	quietEnd: number,
): boolean {
	if (quietStart <= quietEnd) {
		// e.g., 22:00–06:00 stored as start=22, end=6
		return hour >= quietStart || hour < quietEnd;
	}
	// e.g., 08:00–18:00 stored as start=8, end=18
	return hour >= quietStart && hour < quietEnd;
}

// ── Public API ────────────────────────────────────────────────────────

export function startNotificationPoller(): void {
	if (state.running) return;
	state.running = true;

	logger.info(
		{ intervalMs: state.intervalMs, lookaheadMs: state.lookaheadMs },
		"Starting notification poller",
	);

	// Run immediately on start, then on interval
	poll();
	state.timer = setInterval(poll, state.intervalMs);
}

export function stopNotificationPoller(): void {
	if (!state.running) return;
	state.running = false;
	if (state.timer) {
		clearInterval(state.timer);
		state.timer = null;
	}
	logger.info("Notification poller stopped");
}

export function isNotificationPollerRunning(): boolean {
	return state.running;
}
