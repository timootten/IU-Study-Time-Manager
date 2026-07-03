import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";

import { db } from "#/db";
import { sessions } from "#/db/schema";
import { AppError, ErrorCode } from "#/lib/errors/app-error";
import {
	authMiddleware,
	errorLoggingMiddleware,
} from "#/lib/server/middleware";

import {
	addManualStudyTimeInputSchema,
	startFocusSessionInputSchema,
	stopFocusSessionInputSchema,
	updateStudyTimeEntryInputSchema,
} from "../schemas";
import { getOwnedGoal } from "../services/goal.service";
import { randomBrightColor } from "../utils/color";
import { parseDateOrThrow, toIsoString } from "../utils/date";

// ── Start focus session ───────────────────────────────────────────────

export const startStudyFocusSession = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(startFocusSessionInputSchema)
	.handler(async ({ context, data }) => {
		const goal = await getOwnedGoal(context.userId, data.goalId);

		const [existingActive] = await db
			.select({ id: sessions.id })
			.from(sessions)
			.where(
				and(
					eq(sessions.userId, context.userId),
					isNotNull(sessions.startTime),
					isNull(sessions.endTime),
				),
			)
			.limit(1);

		if (existingActive) {
			throw new AppError(ErrorCode.FOCUS_SESSION_ALREADY_RUNNING);
		}

		const now = new Date();
		const normalizedNotes = data.notes?.trim() || null;

		// Start from a planned session
		if (data.plannedSessionId) {
			const [plannedSession] = await db
				.select()
				.from(sessions)
				.where(
					and(
						eq(sessions.id, data.plannedSessionId),
						eq(sessions.userId, context.userId),
					),
				)
				.limit(1);

			if (!plannedSession) {
				throw new AppError(ErrorCode.PLANNED_SESSION_NOT_FOUND);
			}

			if (plannedSession.goalId !== data.goalId) {
				throw new AppError(ErrorCode.PLANNED_SESSION_WRONG_GOAL);
			}

			if (plannedSession.startTime && !plannedSession.endTime) {
				throw new AppError(ErrorCode.PLANNED_SESSION_ALREADY_STARTED);
			}

			const [started] = await db
				.update(sessions)
				.set({
					startTime: now,
					endTime: null,
					notes: normalizedNotes ?? plannedSession.notes,
				})
				.where(eq(sessions.id, plannedSession.id))
				.returning({ id: sessions.id, startTime: sessions.startTime });

			return {
				sessionId: started.id,
				goalId: goal.id,
				goalTitle: goal.title,
				startIso: toIsoString(started.startTime),
			};
		}

		// Start a fresh session
		const [started] = await db
			.insert(sessions)
			.values({
				goalId: goal.id,
				userId: context.userId,
				color: null,
				startTime: now,
				notes: normalizedNotes,
			})
			.returning({ id: sessions.id, startTime: sessions.startTime });

		return {
			sessionId: started.id,
			goalId: goal.id,
			goalTitle: goal.title,
			startIso: toIsoString(started.startTime),
		};
	});

// ── Stop focus session ────────────────────────────────────────────────

export const stopStudyFocusSession = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(stopFocusSessionInputSchema)
	.handler(async ({ context, data }) => {
		const [activeSession] = await db
			.select()
			.from(sessions)
			.where(
				and(
					eq(sessions.userId, context.userId),
					isNotNull(sessions.startTime),
					isNull(sessions.endTime),
				),
			)
			.orderBy(desc(sessions.startTime))
			.limit(1);

		if (!activeSession?.startTime) {
			throw new AppError(ErrorCode.NO_ACTIVE_FOCUS_SESSION);
		}

		const endedAt = new Date();
		const normalizedNotes = data.notes?.trim() || null;
		const mergedNotes = normalizedNotes
			? activeSession.notes
				? `${activeSession.notes}\n${normalizedNotes}`
				: normalizedNotes
			: activeSession.notes;

		const [finished] = await db
			.update(sessions)
			.set({ endTime: endedAt, notes: mergedNotes })
			.where(eq(sessions.id, activeSession.id))
			.returning({
				id: sessions.id,
				startTime: sessions.startTime,
				endTime: sessions.endTime,
			});

		const durationSec =
			finished.startTime && finished.endTime
				? Math.max(
						1,
						Math.floor(
							(finished.endTime.getTime() - finished.startTime.getTime()) /
								1000,
						),
					)
				: 0;

		return {
			sessionId: finished.id,
			durationSec,
			endIso: toIsoString(finished.endTime),
		};
	});

// ── Add manual time entry ─────────────────────────────────────────────

export const addStudyManualTimeEntry = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(addManualStudyTimeInputSchema)
	.handler(async ({ context, data }) => {
		const goal = data.goalId
			? await getOwnedGoal(context.userId, data.goalId)
			: null;
		const startedAt = parseDateOrThrow(data.startedAt, "Start time");
		const durationSec = data.durationMinutes * 60;
		const endedAt = new Date(startedAt.getTime() + durationSec * 1000);
		const sessionName = data.name?.trim() || null;
		const sessionColor = goal ? null : randomBrightColor();

		const [createdEntry] = await db
			.insert(sessions)
			.values({
				goalId: goal?.id ?? null,
				userId: context.userId,
				name: sessionName,
				color: sessionColor,
				startTime: startedAt,
				endTime: endedAt,
				category: data.category,
				source: "manual",
				countsTowardGoal: goal ? data.countsTowardGoal : false,
				notes: data.notes?.trim() || null,
			})
			.returning({ id: sessions.id });

		return createdEntry;
	});

// ── Update time entry ─────────────────────────────────────────────────

export const updateStudyTimeEntry = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(updateStudyTimeEntryInputSchema)
	.handler(async ({ context, data }) => {
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
			throw new AppError(ErrorCode.TIME_ENTRY_NOT_FOUND);
		}

		// Allow editing active sessions from the client. Previously this
		// threw ACTIVE_SESSION_NOT_EDITABLE which prevented any client-side
		// edits. We now permit updates for active sessions and keep their
		// `endTime` null so they remain running unless the client provides
		// an end time via a separate stop action.

		if (existingSession.source === "ics") {
			throw new AppError(ErrorCode.IMPORTED_SESSION_LOCKED);
		}

		const startedAt = parseDateOrThrow(data.startedAt, "Start time");
		const durationSec = data.durationMinutes * 60;
		// If the existing session is active (no endTime), keep it active by
		// setting `endedAt` to null. Otherwise compute the end time from the
		// provided duration.
		const endedAt = existingSession.endTime
			? new Date(startedAt.getTime() + durationSec * 1000)
			: null;
		const sessionName = data.name?.trim() || null;
		const goal = data.goalId
			? await getOwnedGoal(context.userId, data.goalId)
			: null;
		const sessionColor =
			data.color ??
			(goal ? null : (existingSession.color ?? randomBrightColor()));

		const [updatedSession] = await db
			.update(sessions)
			.set({
				goalId: data.goalId ?? null,
				name: sessionName,
				color: sessionColor,
				startTime: startedAt,
				endTime: endedAt,
				category: data.category,
				countsTowardGoal: goal ? data.countsTowardGoal : false,
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
			throw new AppError(ErrorCode.TIME_ENTRY_NOT_FOUND);
		}

		return updatedSession;
	});
