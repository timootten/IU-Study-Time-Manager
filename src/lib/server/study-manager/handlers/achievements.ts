import { createServerFn } from "@tanstack/react-start";
import { and, count, eq, isNull, lt, or } from "drizzle-orm";

import { db } from "#/db";
import { achievements, goals } from "#/db/schema";
import { AppError, ErrorCode } from "#/lib/errors/app-error";
import {
	authMiddleware,
	errorLoggingMiddleware,
} from "#/lib/server/middleware";

import { PASSING_GRADE_THRESHOLD } from "../constants";
import {
	createAchievementInputSchema,
	deleteAchievementInputSchema,
	updateAchievementInputSchema,
} from "../schemas";
import { getOwnedGoal } from "../services/goal.service";
import { parseDateOrThrow } from "../utils/date";

// ── Helpers ───────────────────────────────────────────────────────────

async function getPassingAchievementCount(
	goalId: string,
	userId: string,
): Promise<number> {
	const [{ total }] = await db
		.select({ total: count() })
		.from(achievements)
		.where(
			and(
				eq(achievements.goalId, goalId),
				eq(achievements.userId, userId),
				or(
					isNull(achievements.grade),
					lt(achievements.grade, PASSING_GRADE_THRESHOLD),
				),
			),
		);
	return total;
}

async function autoCompleteGoalIfNeeded(
	goalId: string,
	userId: string,
	requiredCount: number,
): Promise<void> {
	const passingCount = await getPassingAchievementCount(goalId, userId);
	if (passingCount >= requiredCount) {
		await db
			.update(goals)
			.set({ status: "completed" })
			.where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
	}
}

async function reopenGoalIfNeeded(
	goalId: string,
	userId: string,
): Promise<void> {
	const [goal] = await db
		.select({
			id: goals.id,
			status: goals.status,
			requiredCount: goals.requiredCount,
		})
		.from(goals)
		.where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
		.limit(1);

	if (!goal || goal.status !== "completed" || goal.requiredCount <= 0) return;

	const remaining = await getPassingAchievementCount(goal.id, userId);
	if (remaining < goal.requiredCount) {
		await db
			.update(goals)
			.set({ status: "active" })
			.where(and(eq(goals.id, goal.id), eq(goals.userId, userId)));
	}
}

// ── Create ────────────────────────────────────────────────────────────

export const createStudyAchievement = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(createAchievementInputSchema)
	.handler(async ({ context, data }) => {
		let goal: Awaited<ReturnType<typeof getOwnedGoal>> | null = null;
		if (data.goalId) {
			goal = await getOwnedGoal(context.userId, data.goalId);
		}

		if (!data.goalId && (!data.name || data.name.trim().length < 1)) {
			throw new AppError(ErrorCode.ACHIEVEMENT_NAME_REQUIRED);
		}

		const achievedAt = data.achievedAt
			? parseDateOrThrow(data.achievedAt, "Achievement date")
			: new Date();

		const [created] = await db
			.insert(achievements)
			.values({
				goalId: data.goalId ?? null,
				userId: context.userId,
				category: data.category,
				name: data.name?.trim() || null,
				achievedAt,
				grade: data.grade || null,
				points: data.points ?? null,
				notes: data.notes?.trim() || null,
			})
			.returning({ id: achievements.id });

		// Auto-complete goal when passing achievement count reaches requiredCount
		if (
			goal &&
			goal.status === "active" &&
			goal.requiredCount > 0 &&
			data.goalId
		) {
			const gradeNum = data.grade ? Number.parseFloat(data.grade) : null;
			const passed = gradeNum === null || gradeNum <= 4.0;

			if (passed) {
				await autoCompleteGoalIfNeeded(
					data.goalId,
					context.userId,
					goal.requiredCount,
				);
			}
		}

		return created;
	});

// ── Update ────────────────────────────────────────────────────────────

export const updateStudyAchievement = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(updateAchievementInputSchema)
	.handler(async ({ context, data }) => {
		if (data.goalId) {
			await getOwnedGoal(context.userId, data.goalId);
		}

		if (!data.goalId && (!data.name || data.name.trim().length < 1)) {
			throw new AppError(ErrorCode.ACHIEVEMENT_NAME_REQUIRED);
		}

		const achievedAt = parseDateOrThrow(data.achievedAt, "Achievement date");

		const [updated] = await db
			.update(achievements)
			.set({
				goalId: data.goalId ?? null,
				category: data.category,
				name: data.name?.trim() || null,
				achievedAt,
				grade: data.grade || null,
				points: data.points ?? null,
				notes: data.notes?.trim() || null,
			})
			.where(
				and(
					eq(achievements.id, data.achievementId),
					eq(achievements.userId, context.userId),
				),
			)
			.returning({ id: achievements.id });

		if (!updated) {
			throw new AppError(ErrorCode.OUTCOME_NOT_FOUND);
		}

		return updated;
	});

// ── Delete ────────────────────────────────────────────────────────────

export const deleteStudyAchievement = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(deleteAchievementInputSchema)
	.handler(async ({ context, data }) => {
		const [deleted] = await db
			.delete(achievements)
			.where(
				and(
					eq(achievements.id, data.achievementId),
					eq(achievements.userId, context.userId),
				),
			)
			.returning({ id: achievements.id, goalId: achievements.goalId });

		if (!deleted) {
			throw new AppError(ErrorCode.OUTCOME_NOT_FOUND);
		}

		// Reopen goal if passing achievement count drops below requiredCount
		if (deleted.goalId) {
			await reopenGoalIfNeeded(deleted.goalId, context.userId);
		}

		return { id: deleted.id };
	});
