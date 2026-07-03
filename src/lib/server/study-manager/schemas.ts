import { z } from "zod";

import {
	COLOR_PATTERN,
	GOAL_CATEGORIES,
	GOAL_STATUSES,
	GRADE_PATTERN,
	MONTH_PATTERN,
	SESSION_CATEGORIES,
} from "./constants";

// ── Shared field helpers ──────────────────────────────────────────────

const uuid = z.string().uuid();
const optionalUuid = z.string().uuid().optional();
const nullableUuid = z.string().uuid().optional().nullable();
const color = z.string().regex(COLOR_PATTERN).optional();
const notes = z.string().trim().max(1500).optional();
const dateString = z.string().min(1);

/**
 * Refinement: require `name` when `goalId` is absent.
 * Applied to session-like schemas where either a goal or a name is needed.
 */
function requireNameWithoutGoal(
	data: { goalId?: string | null; name?: string },
	ctx: z.RefinementCtx,
) {
	if (!data.goalId && (!data.name || data.name.trim().length < 1)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "Session name is required when no goal is selected.",
			path: ["name"],
		});
	}
}

// ── Goal schemas ──────────────────────────────────────────────────────

export const createGoalInputSchema = z.object({
	title: z.string().trim().min(3).max(120),
	description: z.string().trim().max(1500).optional(),
	category: z.enum(GOAL_CATEGORIES).default("other"),
	color,
	targetHours: z.number().int().positive().max(2000),
	requiredCount: z.number().int().min(1).max(100).default(1),
	startDate: dateString,
	endDate: dateString,
});

export const updateGoalInputSchema = z.object({
	goalId: uuid,
	title: z.string().trim().min(3).max(120),
	description: z.string().trim().max(1500).optional(),
	category: z.enum(GOAL_CATEGORIES).default("other"),
	color,
	targetHours: z.number().int().positive().max(2000),
	requiredCount: z.number().int().min(1).max(100).default(1),
	startDate: dateString,
	endDate: dateString,
});

export const updateGoalStatusInputSchema = z.object({
	goalId: uuid,
	status: z.enum(GOAL_STATUSES),
});

export const deleteGoalInputSchema = z.object({
	goalId: uuid,
});

// ── Monthly plan schemas ──────────────────────────────────────────────

export const upsertMonthlyPlanInputSchema = z.object({
	goalId: uuid,
	month: z.string().regex(MONTH_PATTERN),
	plannedHours: z.number().int().positive().max(300),
	notes,
});

export const updateMonthlyPlanInputSchema = z.object({
	planId: uuid,
	goalId: uuid,
	month: z.string().regex(MONTH_PATTERN),
	plannedHours: z.number().int().positive().max(300),
	notes,
});

export const deleteMonthlyPlanInputSchema = z.object({
	planId: uuid,
});

// ── Session / detailed plan schemas ───────────────────────────────────

export const createDetailedPlanInputSchema = z
	.object({
		goalId: nullableUuid,
		name: z.string().trim().max(120).optional(),
		color,
		startTime: dateString,
		endTime: dateString,
		category: z.enum(SESSION_CATEGORIES).default("learning"),
		countsTowardGoal: z.boolean().default(true),
		notificationsEnabled: z.boolean().optional().default(true),
		notes,
	})
	.superRefine(requireNameWithoutGoal);

export const updateDetailedPlanInputSchema = z
	.object({
		sessionId: uuid,
		goalId: nullableUuid,
		name: z.string().trim().max(120).optional(),
		color,
		startTime: dateString,
		endTime: dateString,
		category: z.enum(SESSION_CATEGORIES).default("learning"),
		countsTowardGoal: z.boolean().default(true),
		notificationsEnabled: z.boolean().optional(),
		notes,
	})
	.superRefine(requireNameWithoutGoal);

export const deleteSessionInputSchema = z.object({
	sessionId: uuid,
});

// ── Timer / manual time schemas ───────────────────────────────────────

export const startFocusSessionInputSchema = z.object({
	goalId: uuid,
	plannedSessionId: optionalUuid,
	notes,
});

export const stopFocusSessionInputSchema = z.object({
	notes,
});

export const addManualStudyTimeInputSchema = z
	.object({
		goalId: nullableUuid,
		name: z.string().trim().max(120).optional(),
		startedAt: dateString,
		durationMinutes: z.number().int().positive().max(720),
		category: z.enum(SESSION_CATEGORIES).default("learning"),
		countsTowardGoal: z.boolean().default(true),
		notes,
	})
	.superRefine(requireNameWithoutGoal);

export const updateStudyTimeEntryInputSchema = z
	.object({
		sessionId: uuid,
		goalId: nullableUuid,
		name: z.string().trim().max(120).optional(),
		color,
		startedAt: dateString,
		durationMinutes: z.number().int().positive().max(720),
		category: z.enum(SESSION_CATEGORIES).default("learning"),
		countsTowardGoal: z.boolean().default(true),
		notes,
	})
	.superRefine(requireNameWithoutGoal);

// ── Milestone schemas ─────────────────────────────────────────────────

export const createMilestoneInputSchema = z.object({
	goalId: uuid,
	title: z.string().trim().min(3).max(180),
	dueDate: dateString,
});

export const updateMilestoneInputSchema = z.object({
	milestoneId: uuid,
	goalId: uuid,
	title: z.string().trim().min(3).max(180),
	dueDate: dateString,
});

export const toggleMilestoneInputSchema = z.object({
	milestoneId: uuid,
	completed: z.boolean(),
});

export const deleteMilestoneInputSchema = z.object({
	milestoneId: uuid,
});

// ── Achievement schemas ───────────────────────────────────────────────

export const createAchievementInputSchema = z.object({
	goalId: optionalUuid,
	category: z.enum(GOAL_CATEGORIES),
	name: z.string().trim().max(180).optional(),
	achievedAt: z.string().optional(),
	grade: z.string().regex(GRADE_PATTERN).nullable().optional(),
	points: z.number().int().min(0).max(100).nullable().optional(),
	notes,
});

export const updateAchievementInputSchema = z.object({
	achievementId: uuid,
	goalId: optionalUuid,
	category: z.enum(GOAL_CATEGORIES),
	name: z.string().trim().max(180).optional(),
	achievedAt: dateString,
	grade: z.string().regex(GRADE_PATTERN).nullable().optional(),
	points: z.number().int().min(0).max(100).nullable().optional(),
	notes,
});

export const deleteAchievementInputSchema = z.object({
	achievementId: uuid,
});

// ── Calendar import schemas ───────────────────────────────────────────

export const createCalendarImportsInputSchema = z.object({
	imports: z
		.array(
			z.object({
				name: z.string().trim().min(2).max(120),
				color: z.string().regex(COLOR_PATTERN),
				icsText: z.string().trim().min(1),
				notificationsEnabled: z.boolean().optional().default(true),
			}),
		)
		.min(1)
		.max(6),
});

export const updateCalendarImportInputSchema = z.object({
	importId: uuid,
	name: z.string().trim().min(2).max(120),
	color: z.string().regex(COLOR_PATTERN),
	visible: z.boolean(),
	notificationsEnabled: z.boolean().optional().default(true),
});

export const deleteCalendarImportInputSchema = z.object({
	importId: uuid,
});
