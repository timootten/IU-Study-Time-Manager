import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { notificationPreferences, pushSubscriptions } from "#/db/schema";
import {
	authMiddleware,
	errorLoggingMiddleware,
} from "#/lib/server/middleware";

// ── Push Subscription ─────────────────────────────────────────────────

const pushSubscribeSchema = z.object({
	endpoint: z.string().min(1),
	keys: z.object({
		p256dh: z.string().min(1),
		auth: z.string().min(1),
	}),
});

export const subscribePush = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(pushSubscribeSchema)
	.handler(async ({ context, data }) => {
		// Upsert: delete existing subscription for this endpoint, then insert
		await db
			.delete(pushSubscriptions)
			.where(
				and(
					eq(pushSubscriptions.userId, context.userId),
					eq(pushSubscriptions.endpoint, data.endpoint),
				),
			);

		await db.insert(pushSubscriptions).values({
			userId: context.userId,
			endpoint: data.endpoint,
			p256dh: data.keys.p256dh,
			auth: data.keys.auth,
		});

		return { subscribed: true };
	});

const pushUnsubscribeSchema = z.object({
	endpoint: z.string().min(1),
});

export const unsubscribePush = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(pushUnsubscribeSchema)
	.handler(async ({ context, data }) => {
		await db
			.delete(pushSubscriptions)
			.where(
				and(
					eq(pushSubscriptions.userId, context.userId),
					eq(pushSubscriptions.endpoint, data.endpoint),
				),
			);

		return { unsubscribed: true };
	});

// ── Notification Preferences ──────────────────────────────────────────

export const getNotificationPreferences = createServerFn({
	method: "GET",
})
	.middleware([errorLoggingMiddleware, authMiddleware])
	.handler(async ({ context }) => {
		const [pref] = await db
			.select()
			.from(notificationPreferences)
			.where(eq(notificationPreferences.userId, context.userId))
			.limit(1);

		if (!pref) {
			// Return defaults — user hasn't customized yet
			return {
				emailEnabled: true,
				pushEnabled: true,
				emailLeadMinutes: 30,
				pushLeadMinutes: 5,
				quietHourStart: null as number | null,
				quietHourEnd: null as number | null,
			};
		}

		return {
			emailEnabled: pref.emailEnabled,
			pushEnabled: pref.pushEnabled,
			emailLeadMinutes: pref.emailLeadMinutes,
			pushLeadMinutes: pref.pushLeadMinutes,
			quietHourStart: pref.quietHourStart ?? null,
			quietHourEnd: pref.quietHourEnd ?? null,
		};
	});

const updatePreferencesSchema = z.object({
	emailEnabled: z.boolean().optional(),
	pushEnabled: z.boolean().optional(),
	emailLeadMinutes: z.number().int().min(1).max(120).optional(),
	pushLeadMinutes: z.number().int().min(1).max(60).optional(),
	quietHourStart: z.number().int().min(0).max(23).nullable().optional(),
	quietHourEnd: z.number().int().min(0).max(23).nullable().optional(),
});

export const updateNotificationPreferences = createServerFn({
	method: "POST",
})
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(updatePreferencesSchema)
	.handler(async ({ context, data }) => {
		const [existing] = await db
			.select({ id: notificationPreferences.id })
			.from(notificationPreferences)
			.where(eq(notificationPreferences.userId, context.userId))
			.limit(1);

		if (existing) {
			await db
				.update(notificationPreferences)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(notificationPreferences.userId, context.userId));
		} else {
			await db.insert(notificationPreferences).values({
				userId: context.userId,
				emailEnabled: data.emailEnabled ?? true,
				pushEnabled: data.pushEnabled ?? true,
				emailLeadMinutes: data.emailLeadMinutes ?? 30,
				pushLeadMinutes: data.pushLeadMinutes ?? 5,
				quietHourStart: data.quietHourStart ?? null,
				quietHourEnd: data.quietHourEnd ?? null,
			});
		}

		return { updated: true };
	});
