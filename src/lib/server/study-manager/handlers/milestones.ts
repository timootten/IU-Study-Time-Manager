import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";

import { db } from "#/db";
import { milestones } from "#/db/schema";
import { AppError, ErrorCode } from "#/lib/errors/app-error";
import {
	authMiddleware,
	errorLoggingMiddleware,
} from "#/lib/server/middleware";

import {
	createMilestoneInputSchema,
	deleteMilestoneInputSchema,
	toggleMilestoneInputSchema,
	updateMilestoneInputSchema,
} from "../schemas";
import { getOwnedGoal } from "../services/goal.service";
import { parseDateOrThrow, toIsoString } from "../utils/date";

// ── Create ────────────────────────────────────────────────────────────

export const createStudyMilestone = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(createMilestoneInputSchema)
	.handler(async ({ context, data }) => {
		const goal = await getOwnedGoal(context.userId, data.goalId);
		const dueDate = parseDateOrThrow(data.dueDate, "Due date");

		if (dueDate < goal.startDate || dueDate > goal.endDate) {
			throw new AppError(ErrorCode.MILESTONE_OUTSIDE_GOAL);
		}

		const [created] = await db
			.insert(milestones)
			.values({
				goalId: data.goalId,
				userId: context.userId,
				title: data.title,
				dueDate,
			})
			.returning({ id: milestones.id, title: milestones.title });

		return created;
	});

// ── Update ────────────────────────────────────────────────────────────

export const updateStudyMilestone = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(updateMilestoneInputSchema)
	.handler(async ({ context, data }) => {
		const goal = await getOwnedGoal(context.userId, data.goalId);
		const dueDate = parseDateOrThrow(data.dueDate, "Due date");

		if (dueDate < goal.startDate || dueDate > goal.endDate) {
			throw new AppError(ErrorCode.MILESTONE_OUTSIDE_GOAL);
		}

		const [updated] = await db
			.update(milestones)
			.set({ goalId: data.goalId, title: data.title, dueDate })
			.where(
				and(
					eq(milestones.id, data.milestoneId),
					eq(milestones.userId, context.userId),
				),
			)
			.returning({ id: milestones.id });

		if (!updated) {
			throw new AppError(ErrorCode.MILESTONE_NOT_FOUND);
		}

		return updated;
	});

// ── Toggle completion ─────────────────────────────────────────────────

export const toggleStudyMilestoneCompletion = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(toggleMilestoneInputSchema)
	.handler(async ({ context, data }) => {
		const [updated] = await db
			.update(milestones)
			.set({ completedAt: data.completed ? new Date() : null })
			.where(
				and(
					eq(milestones.id, data.milestoneId),
					eq(milestones.userId, context.userId),
				),
			)
			.returning({ id: milestones.id, completedAt: milestones.completedAt });

		if (!updated) {
			throw new AppError(ErrorCode.MILESTONE_NOT_FOUND);
		}

		return {
			id: updated.id,
			completedAtIso: toIsoString(updated.completedAt),
		};
	});

// ── Delete ────────────────────────────────────────────────────────────

export const deleteStudyMilestone = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(deleteMilestoneInputSchema)
	.handler(async ({ context, data }) => {
		const [deleted] = await db
			.delete(milestones)
			.where(
				and(
					eq(milestones.id, data.milestoneId),
					eq(milestones.userId, context.userId),
				),
			)
			.returning({ id: milestones.id });

		if (!deleted) {
			throw new AppError(ErrorCode.MILESTONE_NOT_FOUND);
		}

		return deleted;
	});
