import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";

import { db } from "#/db";
import { calendarImports, sessions } from "#/db/schema";
import { AppError, ErrorCode } from "#/lib/errors/app-error";
import {
	authMiddleware,
	errorLoggingMiddleware,
} from "#/lib/server/middleware";

import { MAX_ICS_EVENTS_PER_IMPORT } from "../constants";
import {
	createCalendarImportsInputSchema,
	deleteCalendarImportInputSchema,
	updateCalendarImportInputSchema,
} from "../schemas";
import type { StudyCalendarImportView } from "../types";
import { buildIcsNotes, parseIcsEvents } from "../utils/ics-parser";

// ── Create (batch import) ─────────────────────────────────────────────

export const createCalendarImports = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(createCalendarImportsInputSchema)
	.handler(async ({ context, data }) => {
		return db.transaction(async (tx) => {
			const createdImports: StudyCalendarImportView[] = [];
			const sessionRows: (typeof sessions.$inferInsert)[] = [];

			for (const entry of data.imports) {
				const events = parseIcsEvents(entry.icsText).slice(
					0,
					MAX_ICS_EVENTS_PER_IMPORT,
				);
				if (events.length === 0) {
					throw new AppError(ErrorCode.ICS_IMPORT_EMPTY);
				}

				const [createdImport] = await tx
					.insert(calendarImports)
					.values({
						userId: context.userId,
						name: entry.name.trim(),
						color: entry.color,
						visible: true,
						notificationsEnabled: entry.notificationsEnabled ?? true,
					})
					.returning({
						id: calendarImports.id,
						name: calendarImports.name,
						color: calendarImports.color,
						visible: calendarImports.visible,
						notificationsEnabled: calendarImports.notificationsEnabled,
						createdAt: calendarImports.createdAt,
					});

				for (const event of events) {
					const notes = buildIcsNotes(event.description, event.location);
					sessionRows.push({
						userId: context.userId,
						importId: createdImport.id,
						name: event.summary,
						color: null,
						startTime: event.start,
						endTime: event.end,
						category: "course",
						source: "ics",
						countsTowardGoal: false,
						notes,
					});
				}

				createdImports.push({
					id: createdImport.id,
					name: createdImport.name,
					color: createdImport.color,
					visible: createdImport.visible ?? true,
					notificationsEnabled: createdImport.notificationsEnabled ?? true,
					createdAtIso: createdImport.createdAt.toISOString(),
				});
			}

			if (sessionRows.length > 0) {
				await tx.insert(sessions).values(sessionRows);
			}

			return { imports: createdImports, sessionCount: sessionRows.length };
		});
	});

// ── Update ────────────────────────────────────────────────────────────

export const updateCalendarImport = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(updateCalendarImportInputSchema)
	.handler(async ({ context, data }) => {
		const [existing] = await db
			.select({ id: calendarImports.id })
			.from(calendarImports)
			.where(
				and(
					eq(calendarImports.id, data.importId),
					eq(calendarImports.userId, context.userId),
				),
			)
			.limit(1);

		if (!existing) {
			throw new AppError(ErrorCode.CALENDAR_IMPORT_NOT_FOUND);
		}

		const [updated] = await db
			.update(calendarImports)
			.set({
				name: data.name.trim(),
				color: data.color,
				visible: data.visible,
				notificationsEnabled: data.notificationsEnabled ?? true,
			})
			.where(
				and(
					eq(calendarImports.id, data.importId),
					eq(calendarImports.userId, context.userId),
				),
			)
			.returning({
				id: calendarImports.id,
				name: calendarImports.name,
				color: calendarImports.color,
				visible: calendarImports.visible,
				notificationsEnabled: calendarImports.notificationsEnabled,
				createdAt: calendarImports.createdAt,
			});

		if (!updated) {
			throw new AppError(ErrorCode.CALENDAR_IMPORT_NOT_FOUND);
		}

		return {
			id: updated.id,
			name: updated.name,
			color: updated.color,
			visible: updated.visible ?? true,
			notificationsEnabled: updated.notificationsEnabled ?? true,
			createdAtIso: updated.createdAt.toISOString(),
		} satisfies StudyCalendarImportView;
	});

// ── Delete ────────────────────────────────────────────────────────────

export const deleteCalendarImport = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(deleteCalendarImportInputSchema)
	.handler(async ({ context, data }) => {
		const [deleted] = await db
			.delete(calendarImports)
			.where(
				and(
					eq(calendarImports.id, data.importId),
					eq(calendarImports.userId, context.userId),
				),
			)
			.returning({ id: calendarImports.id });

		if (!deleted) {
			throw new AppError(ErrorCode.CALENDAR_IMPORT_NOT_FOUND);
		}

		return deleted;
	});
