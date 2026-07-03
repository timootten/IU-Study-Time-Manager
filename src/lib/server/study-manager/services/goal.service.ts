import { and, eq } from "drizzle-orm";

import { db } from "#/db";
import { goals } from "#/db/schema";
import { AppError, ErrorCode } from "#/lib/errors/app-error";

import { MAX_GOAL_DURATION_DAYS } from "../constants";

/**
 * Fetch a goal that belongs to the given user, or throw `GOAL_NOT_FOUND`.
 */
export async function getOwnedGoal(userId: string, goalId: string) {
	const [ownedGoal] = await db
		.select()
		.from(goals)
		.where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
		.limit(1);

	if (!ownedGoal) {
		throw new AppError(ErrorCode.GOAL_NOT_FOUND);
	}

	return ownedGoal;
}

/**
 * Validate that the goal date window is valid:
 * - `endDate` must be after `startDate`
 * - Duration must not exceed `MAX_GOAL_DURATION_DAYS`
 */
export function ensureGoalWindow(startDate: Date, endDate: Date): void {
	if (endDate <= startDate) {
		throw new AppError(ErrorCode.END_BEFORE_START);
	}

	const durationDays =
		(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

	if (durationDays > MAX_GOAL_DURATION_DAYS) {
		throw new AppError(ErrorCode.GOAL_TOO_LONG);
	}
}
