import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";

import { db } from "#/db";
import { sessions } from "#/db/schema";
import { AppError, ErrorCode } from "#/lib/errors/app-error";
import {
	authMiddleware,
	errorLoggingMiddleware,
} from "#/lib/server/middleware";

import { MIN_SESSION_DURATION_MINUTES } from "../constants";
import {
	createDetailedPlanInputSchema,
	deleteSessionInputSchema,
	updateDetailedPlanInputSchema,
} from "../schemas";
import { getOwnedGoal } from "../services/goal.service";
import { randomBrightColor } from "../utils/color";
import { parseDateOrThrow, toIsoString } from "../utils/date";

// ── Create ────────────────────────────────────────────────────────────

export const createStudyDetailedPlan = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(createDetailedPlanInputSchema)
	.handler(async ({ context, data }) => {
		const goal = data.goalId
			? await getOwnedGoal(context.userId, data.goalId)
			: null;
		const startTime = parseDateOrThrow(data.startTime, "Start time");
		const endTime = parseDateOrThrow(data.endTime, "End time");
		const sessionName = data.name?.trim() || null;
		const sessionColor = data.color ?? (goal ? null : randomBrightColor());

		if (endTime <= startTime) {
			throw new AppError(ErrorCode.END_BEFORE_START);
		}

		const durationMinutes =
			(endTime.getTime() - startTime.getTime()) / (1000 * 60);
		if (durationMinutes < MIN_SESSION_DURATION_MINUTES) {
			throw new AppError(ErrorCode.SESSION_TOO_SHORT);
		}

		const [createdSession] = await db
			.insert(sessions)
			.values({
				goalId: data.goalId ?? null,
				userId: context.userId,
				name: sessionName,
				color: sessionColor,
				startTime,
				endTime,
				category: data.category,
				source: "manual",
				countsTowardGoal: goal ? data.countsTowardGoal : false,
				notificationsEnabled: data.notificationsEnabled ?? true,
				notes: data.notes?.trim() || null,
			})
			.returning({
				id: sessions.id,
				startTime: sessions.startTime,
				endTime: sessions.endTime,
			});

		return {
			sessionId: createdSession.id,
			startIso: toIsoString(createdSession.startTime),
			endIso: toIsoString(createdSession.endTime),
		};
	});

// ── Update ────────────────────────────────────────────────────────────

export const updateStudyDetailedPlan = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(updateDetailedPlanInputSchema)
	.handler(async ({ context, data }) => {
		const goal = data.goalId
			? await getOwnedGoal(context.userId, data.goalId)
			: null;

		const [existingSession] = await db
			.select({
				id: sessions.id,
				startTime: sessions.startTime,
				endTime: sessions.endTime,
				color: sessions.color,
				source: sessions.source,
			})
			.from(sessions)
			.where(
				and(
					eq(sessions.id, data.sessionId),
					eq(sessions.userId, context.userId),
				),
			)
			.limit(1);

		if (!existingSession) {
			throw new AppError(ErrorCode.DETAILED_PLAN_NOT_FOUND);
		}

		if (existingSession.startTime && !existingSession.endTime) {
			throw new AppError(ErrorCode.ACTIVE_SESSION_NOT_EDITABLE);
		}

		if (existingSession.source === "ics") {
			throw new AppError(ErrorCode.IMPORTED_SESSION_LOCKED);
		}

		const startTime = parseDateOrThrow(data.startTime, "Start time");
		const endTime = parseDateOrThrow(data.endTime, "End time");
		const sessionName = data.name?.trim() || null;
		const sessionColor =
			data.color ??
			(goal ? null : (existingSession.color ?? randomBrightColor()));

		if (endTime <= startTime) {
			throw new AppError(ErrorCode.END_BEFORE_START);
		}

		const durationMinutes =
			(endTime.getTime() - startTime.getTime()) / (1000 * 60);
		if (durationMinutes < MIN_SESSION_DURATION_MINUTES) {
			throw new AppError(ErrorCode.SESSION_TOO_SHORT);
		}

		const [updatedSession] = await db
			.update(sessions)
			.set({
				goalId: data.goalId ?? null,
				name: sessionName,
				color: sessionColor,
				startTime,
				endTime,
				category: data.category,
				countsTowardGoal: goal ? data.countsTowardGoal : false,
				notificationsEnabled: data.notificationsEnabled ?? true,
				notes: data.notes?.trim() || null,
			})
			.where(
				and(
					eq(sessions.id, data.sessionId),
					eq(sessions.userId, context.userId),
				),
			)
			.returning({ id: sessions.id });

		if (!updatedSession) {
			throw new AppError(ErrorCode.DETAILED_PLAN_NOT_FOUND);
		}

		return updatedSession;
	});

// ── Delete ────────────────────────────────────────────────────────────

export const deleteStudySession = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(deleteSessionInputSchema)
	.handler(async ({ context, data }) => {
		const [existingSession] = await db
			.select({
				id: sessions.id,
				startTime: sessions.startTime,
				endTime: sessions.endTime,
				source: sessions.source,
			})
			.from(sessions)
			.where(
				and(
					eq(sessions.id, data.sessionId),
					eq(sessions.userId, context.userId),
				),
			)
			.limit(1);

		if (!existingSession) {
			throw new AppError(ErrorCode.SESSION_NOT_FOUND);
		}

		// Deleting active sessions is allowed now. Previously this threw
		// ACTIVE_SESSION_NOT_DELETABLE which prevented users from removing
		// sessions that were started but not yet stopped. We keep the
		// restriction for imported ICS sessions below.

		if (existingSession.source === "ics") {
			throw new AppError(ErrorCode.IMPORTED_SESSION_LOCKED);
		}

		const [deletedSession] = await db
			.delete(sessions)
			.where(
				and(
					eq(sessions.id, data.sessionId),
					eq(sessions.userId, context.userId),
				),
			)
			.returning({ id: sessions.id });

		if (!deletedSession) {
			throw new AppError(ErrorCode.SESSION_NOT_FOUND);
		}

		return deletedSession;
	});
