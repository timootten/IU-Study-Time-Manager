import { createServerFn } from "@tanstack/react-start";
import { and, eq, gt, lt, or } from "drizzle-orm";

import { db } from "#/db";
import { goals, milestones } from "#/db/schema";
import { AppError, ErrorCode } from "#/lib/errors/app-error";
import {
	authMiddleware,
	errorLoggingMiddleware,
} from "#/lib/server/middleware";

import {
	createGoalInputSchema,
	deleteGoalInputSchema,
	updateGoalInputSchema,
	updateGoalStatusInputSchema,
} from "../schemas";
import { ensureGoalWindow } from "../services/goal.service";
import { randomBrightColor } from "../utils/color";
import { parseDateOrThrow } from "../utils/date";

// ── Create ────────────────────────────────────────────────────────────

export const createStudyGoal = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(createGoalInputSchema)
	.handler(async ({ context, data }) => {
		const startDate = parseDateOrThrow(data.startDate, "Start date");
		const endDate = parseDateOrThrow(data.endDate, "End date");
		ensureGoalWindow(startDate, endDate);

		const [createdGoal] = await db
			.insert(goals)
			.values({
				userId: context.userId,
				title: data.title,
				color: data.color ?? randomBrightColor(),
				description: data.description?.trim() || null,
				category: data.category,
				targetHours: data.targetHours,
				requiredCount: data.requiredCount,
				startDate,
				endDate,
			})
			.returning({ id: goals.id, title: goals.title });

		return { goalId: createdGoal.id, title: createdGoal.title };
	});

// ── Update ────────────────────────────────────────────────────────────

export const updateStudyGoal = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(updateGoalInputSchema)
	.handler(async ({ context, data }) => {
		const startDate = parseDateOrThrow(data.startDate, "Start date");
		const endDate = parseDateOrThrow(data.endDate, "End date");
		ensureGoalWindow(startDate, endDate);

		const [outOfRangeMilestone] = await db
			.select({ id: milestones.id })
			.from(milestones)
			.where(
				and(
					eq(milestones.userId, context.userId),
					eq(milestones.goalId, data.goalId),
					or(
						lt(milestones.dueDate, startDate),
						gt(milestones.dueDate, endDate),
					),
				),
			)
			.limit(1);

		if (outOfRangeMilestone) {
			throw new AppError(ErrorCode.MILESTONES_OUTSIDE_GOAL);
		}

		const updateValues: Partial<typeof goals.$inferInsert> = {
			title: data.title,
			description: data.description?.trim() || null,
			category: data.category,
			targetHours: data.targetHours,
			requiredCount: data.requiredCount,
			startDate,
			endDate,
		};

		if (data.color) {
			updateValues.color = data.color;
		}

		const [updatedGoal] = await db
			.update(goals)
			.set(updateValues)
			.where(and(eq(goals.id, data.goalId), eq(goals.userId, context.userId)))
			.returning({ id: goals.id });

		if (!updatedGoal) {
			throw new AppError(ErrorCode.GOAL_NOT_FOUND);
		}

		return updatedGoal;
	});

// ── Update status ─────────────────────────────────────────────────────

export const updateStudyGoalStatus = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(updateGoalStatusInputSchema)
	.handler(async ({ context, data }) => {
		const [updatedGoal] = await db
			.update(goals)
			.set({ status: data.status })
			.where(and(eq(goals.id, data.goalId), eq(goals.userId, context.userId)))
			.returning({ id: goals.id, status: goals.status });

		if (!updatedGoal) {
			throw new AppError(ErrorCode.GOAL_NOT_FOUND);
		}

		return updatedGoal;
	});

// ── Delete ────────────────────────────────────────────────────────────

export const deleteStudyGoal = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(deleteGoalInputSchema)
	.handler(async ({ context, data }) => {
		const [deletedGoal] = await db
			.delete(goals)
			.where(and(eq(goals.id, data.goalId), eq(goals.userId, context.userId)))
			.returning({ id: goals.id });

		if (!deletedGoal) {
			throw new AppError(ErrorCode.GOAL_NOT_FOUND);
		}

		return deletedGoal;
	});
