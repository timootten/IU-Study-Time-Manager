import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";

import { db } from "#/db";
import { monthlyPlans } from "#/db/schema";
import { AppError, ErrorCode } from "#/lib/errors/app-error";
import {
	authMiddleware,
	errorLoggingMiddleware,
} from "#/lib/server/middleware";

import {
	deleteMonthlyPlanInputSchema,
	updateMonthlyPlanInputSchema,
	upsertMonthlyPlanInputSchema,
} from "../schemas";
import { getOwnedGoal } from "../services/goal.service";
import { getMonthRange } from "../utils/date";

// ── Upsert ────────────────────────────────────────────────────────────

export const upsertStudyMonthlyPlan = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(upsertMonthlyPlanInputSchema)
	.handler(async ({ context, data }) => {
		const goal = await getOwnedGoal(context.userId, data.goalId);
		const { monthStart, monthEnd } = getMonthRange(data.month);

		if (monthEnd < goal.startDate || monthStart > goal.endDate) {
			throw new AppError(ErrorCode.MONTH_OUTSIDE_GOAL);
		}

		const [savedPlan] = await db
			.insert(monthlyPlans)
			.values({
				goalId: goal.id,
				userId: context.userId,
				month: data.month,
				plannedHours: data.plannedHours,
				notes: data.notes?.trim() || null,
			})
			.onConflictDoUpdate({
				target: [monthlyPlans.userId, monthlyPlans.goalId, monthlyPlans.month],
				set: {
					plannedHours: data.plannedHours,
					notes: data.notes?.trim() || null,
				},
			})
			.returning({
				id: monthlyPlans.id,
				month: monthlyPlans.month,
				plannedHours: monthlyPlans.plannedHours,
			});

		return savedPlan;
	});

// ── Update ────────────────────────────────────────────────────────────

export const updateStudyMonthlyPlan = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(updateMonthlyPlanInputSchema)
	.handler(async ({ context, data }) => {
		const goal = await getOwnedGoal(context.userId, data.goalId);
		const { monthStart, monthEnd } = getMonthRange(data.month);

		if (monthEnd < goal.startDate || monthStart > goal.endDate) {
			throw new AppError(ErrorCode.MONTH_OUTSIDE_GOAL);
		}

		const [updatedPlan] = await db
			.update(monthlyPlans)
			.set({
				goalId: data.goalId,
				month: data.month,
				plannedHours: data.plannedHours,
				notes: data.notes?.trim() || null,
			})
			.where(
				and(
					eq(monthlyPlans.id, data.planId),
					eq(monthlyPlans.userId, context.userId),
				),
			)
			.returning({ id: monthlyPlans.id });

		if (!updatedPlan) {
			throw new AppError(ErrorCode.ROUGH_PLAN_NOT_FOUND);
		}

		return updatedPlan;
	});

// ── Delete ────────────────────────────────────────────────────────────

export const deleteStudyMonthlyPlan = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(deleteMonthlyPlanInputSchema)
	.handler(async ({ context, data }) => {
		const [deletedPlan] = await db
			.delete(monthlyPlans)
			.where(
				and(
					eq(monthlyPlans.id, data.planId),
					eq(monthlyPlans.userId, context.userId),
				),
			)
			.returning({ id: monthlyPlans.id });

		if (!deletedPlan) {
			throw new AppError(ErrorCode.ROUGH_PLAN_NOT_FOUND);
		}

		return deletedPlan;
	});
