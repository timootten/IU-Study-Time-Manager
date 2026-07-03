import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";

import { db } from "#/db";
import {
	achievements,
	calendarImports,
	goals,
	milestones,
	monthlyPlans,
	sessions,
} from "#/db/schema";
import { AppError, ErrorCode } from "#/lib/errors/app-error";
import {
	authMiddleware,
	errorLoggingMiddleware,
} from "#/lib/server/middleware";

import {
	ANALYTICS_WEEK_WINDOW,
	DASHBOARD_ACHIEVEMENT_LIMIT,
	DASHBOARD_SESSION_LIMIT,
	MONTHLY_TIMELINE_WINDOW,
	OVERDUE_SESSION_THRESHOLD_MINUTES,
	RECENT_SESSIONS_LIMIT,
} from "../constants";
import { getSessionStatus } from "../services/session-status";
import type {
	GoalStatus,
	StudyAchievementView,
	StudyActiveSessionView,
	StudyCalendarImportView,
	StudyDashboardSnapshot,
	StudyGoalProgressView,
	StudyGoalView,
	StudyMilestoneView,
	StudyMonthlyTimelinePoint,
	StudyRoughPlanView,
	StudySessionView,
	StudyWeeklyTimelinePoint,
} from "../types";
import { colorFromString } from "../utils/color";
import {
	formatDateLabel,
	formatWeekLabel,
	getDaysSince,
	getMonthKey,
	getPreviousMonths,
	getWeekStartUtc,
	getWeekWindow,
	toIsoString,
	toUtcDateKey,
} from "../utils/date";
import { roundHours, secondsToHours } from "../utils/math";

// ── Sub-aggregators ───────────────────────────────────────────────────

function aggregatePlannedHours(
	planRows: { goalId: string; plannedHours: number; month: string }[],
) {
	const byGoal = new Map<string, number>();
	const byMonth = new Map<string, number>();

	for (const plan of planRows) {
		byGoal.set(plan.goalId, (byGoal.get(plan.goalId) ?? 0) + plan.plannedHours);
		byMonth.set(plan.month, (byMonth.get(plan.month) ?? 0) + plan.plannedHours);
	}

	return { byGoal, byMonth };
}

function groupMilestonesByGoal<T extends { goalId: string }>(
	milestoneRows: T[],
) {
	const map = new Map<string, T[]>();
	for (const milestone of milestoneRows) {
		const list = map.get(milestone.goalId) ?? [];
		list.push(milestone);
		map.set(milestone.goalId, list);
	}
	return map;
}

interface SessionAggregation {
	totalTrackedSeconds: number;
	lectureSeconds: number;
	learningSeconds: number;
	missedPlannedSessions: number;
	lastCompletedSessionDate: Date | null;
	trackedSecondsByGoal: Map<string, number>;
	actualHoursByMonth: Map<string, number>;
	weeklyTotals: Map<string, { hours: number }>;
}

function aggregateSessions(
	sessionRows: {
		startTime: Date | null;
		endTime: Date | null;
		category: string;
		countsTowardGoal: boolean;
		goalId: string | null;
	}[],
	now: Date,
): SessionAggregation {
	const result: SessionAggregation = {
		totalTrackedSeconds: 0,
		lectureSeconds: 0,
		learningSeconds: 0,
		missedPlannedSessions: 0,
		lastCompletedSessionDate: null,
		trackedSecondsByGoal: new Map(),
		actualHoursByMonth: new Map(),
		weeklyTotals: new Map(),
	};

	for (const session of sessionRows) {
		// A planned session is considered missed when it has a start time but no
		// end time, and the start time is past the overdue threshold.
		if (
			session.startTime &&
			!session.endTime &&
			session.startTime.getTime() <
				now.getTime() - OVERDUE_SESSION_THRESHOLD_MINUTES * 60_000
		) {
			result.missedPlannedSessions += 1;
		}

		if (!session.startTime || !session.endTime) continue;

		const durationSec = Math.max(
			0,
			Math.floor(
				(session.endTime.getTime() - session.startTime.getTime()) / 1000,
			),
		);
		if (durationSec <= 0) continue;

		const sessionEnded = session.endTime.getTime() <= now.getTime();
		if (!sessionEnded) continue;

		result.totalTrackedSeconds += durationSec;

		if (session.category === "course") result.lectureSeconds += durationSec;
		else if (session.category === "learning")
			result.learningSeconds += durationSec;

		if (session.countsTowardGoal && session.goalId) {
			result.trackedSecondsByGoal.set(
				session.goalId,
				(result.trackedSecondsByGoal.get(session.goalId) ?? 0) + durationSec,
			);
		}

		if (
			!result.lastCompletedSessionDate ||
			session.endTime.getTime() > result.lastCompletedSessionDate.getTime()
		) {
			result.lastCompletedSessionDate = session.endTime;
		}

		const monthKey = getMonthKey(session.endTime);
		result.actualHoursByMonth.set(
			monthKey,
			(result.actualHoursByMonth.get(monthKey) ?? 0) + durationSec / 3600,
		);

		const weekStart = getWeekStartUtc(session.endTime);
		const weekKey = toUtcDateKey(weekStart);
		const existingWeek = result.weeklyTotals.get(weekKey) ?? { hours: 0 };
		existingWeek.hours += durationSec / 3600;
		result.weeklyTotals.set(weekKey, existingWeek);
	}

	return result;
}

function buildTimeline(
	now: Date,
	plannedByMonth: Map<string, number>,
	actualByMonth: Map<string, number>,
	weeklyTotals: Map<string, { hours: number }>,
): {
	nextSixMonths: StudyMonthlyTimelinePoint[];
	weeklyHours: StudyWeeklyTimelinePoint[];
} {
	const monthWindow = getPreviousMonths(now, MONTHLY_TIMELINE_WINDOW);
	const nextSixMonths = monthWindow.map(({ month, firstDay }) => ({
		month,
		label: formatDateLabel(firstDay),
		plannedHours: roundHours(plannedByMonth.get(month) ?? 0),
		actualHours: roundHours(actualByMonth.get(month) ?? 0),
	}));

	const weekWindow = getWeekWindow(now, ANALYTICS_WEEK_WINDOW);
	const weeklyHours = weekWindow.map((weekStart) => {
		const weekKey = toUtcDateKey(weekStart);
		const totals = weeklyTotals.get(weekKey);
		return {
			weekStartIso: weekStart.toISOString(),
			label: formatWeekLabel(weekStart),
			hours: roundHours(totals?.hours ?? 0),
		};
	});

	return { nextSixMonths, weeklyHours };
}

// ── Session view mapper ───────────────────────────────────────────────

function toSessionView(
	session: {
		id: string;
		goalId: string | null;
		name: string | null;
		color: string | null;
		startTime: Date;
		endTime: Date;
		category: "course" | "learning" | "other";
		countsTowardGoal: boolean;
		notificationsEnabled: boolean;
		notes: string | null;
		importId: string | null;
		source: "manual" | "ics";
	},
	goalMap: Map<string, { title: string; color: string | null }>,
	importColorMap: Map<string, string>,
	now: Date,
): StudySessionView {
	const durationSec = Math.max(
		0,
		Math.floor(
			(session.endTime.getTime() - session.startTime.getTime()) / 1000,
		),
	);
	const fallbackGoalColor = session.goalId
		? (goalMap.get(session.goalId)?.color ?? colorFromString(session.goalId))
		: null;
	const fallbackImportColor = session.importId
		? (importColorMap.get(session.importId) ?? null)
		: null;
	const sessionColor =
		session.color ??
		fallbackGoalColor ??
		fallbackImportColor ??
		colorFromString(session.id);

	return {
		id: session.id,
		goalId: session.goalId ?? null,
		goalTitle: session.goalId
			? (goalMap.get(session.goalId)?.title ?? "Goal no longer available")
			: (session.name ?? "No goal"),
		name: session.name ?? null,
		color: sessionColor,
		startIso: session.startTime.toISOString(),
		endIso: session.endTime.toISOString(),
		durationSec,
		category: session.category,
		countsTowardGoal: session.countsTowardGoal,
		notificationsEnabled: session.notificationsEnabled,
		notes: session.notes,
		status: getSessionStatus(session, now),
		importId: session.importId ?? null,
		source: session.source,
	};
}

// ── Main aggregation ──────────────────────────────────────────────────

async function collectStudyDashboardSnapshot(
	userId: string,
): Promise<StudyDashboardSnapshot> {
	const now = new Date();

	const [
		goalRows,
		planRows,
		milestoneRows,
		sessionRows,
		achievementRows,
		activeRows,
		importRows,
	] = await Promise.all([
		db
			.select()
			.from(goals)
			.where(eq(goals.userId, userId))
			.orderBy(desc(goals.createdAt)),
		db
			.select()
			.from(monthlyPlans)
			.where(eq(monthlyPlans.userId, userId))
			.orderBy(asc(monthlyPlans.month), asc(monthlyPlans.createdAt)),
		db
			.select()
			.from(milestones)
			.where(eq(milestones.userId, userId))
			.orderBy(asc(milestones.dueDate), asc(milestones.createdAt)),
		db
			.select()
			.from(sessions)
			.where(eq(sessions.userId, userId))
			.orderBy(desc(sessions.createdAt))
			.limit(DASHBOARD_SESSION_LIMIT),
		db
			.select()
			.from(achievements)
			.where(eq(achievements.userId, userId))
			.orderBy(desc(achievements.achievedAt))
			.limit(DASHBOARD_ACHIEVEMENT_LIMIT),
		db
			.select()
			.from(sessions)
			.where(
				and(
					eq(sessions.userId, userId),
					isNotNull(sessions.startTime),
					isNull(sessions.endTime),
				),
			)
			.orderBy(desc(sessions.startTime))
			.limit(1),
		db
			.select()
			.from(calendarImports)
			.where(eq(calendarImports.userId, userId))
			.orderBy(desc(calendarImports.createdAt)),
	]);

	const goalMap = new Map(goalRows.map((g) => [g.id, g] as const));
	const importColorMap = new Map(
		importRows.map((e) => [e.id, e.color] as const),
	);
	const milestonesByGoal = groupMilestonesByGoal(milestoneRows);
	const plannedHours = aggregatePlannedHours(planRows);
	const sessionAgg = aggregateSessions(sessionRows, now);

	const timeline = buildTimeline(
		now,
		plannedHours.byMonth,
		sessionAgg.actualHoursByMonth,
		sessionAgg.weeklyTotals,
	);

	const plannedHoursSixMonths = roundHours(
		timeline.nextSixMonths.reduce((sum, p) => sum + p.plannedHours, 0),
	);
	const actualHoursSixMonths = roundHours(
		timeline.nextSixMonths.reduce((sum, p) => sum + p.actualHours, 0),
	);

	// Achievement counts per goal
	const achievementCountByGoal = new Map<string, number>();
	for (const a of achievementRows) {
		if (a.goalId) {
			achievementCountByGoal.set(
				a.goalId,
				(achievementCountByGoal.get(a.goalId) ?? 0) + 1,
			);
		}
	}

	// Goal progress
	const goalProgress: StudyGoalProgressView[] = goalRows
		.map((goal) => {
			const ms = milestonesByGoal.get(goal.id) ?? [];
			const openMs = ms
				.filter((m) => !m.completedAt)
				.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
			const nextMilestone = openMs[0] ?? null;
			const completedMs = ms.filter((m) => Boolean(m.completedAt)).length;
			const actualHrs = secondsToHours(
				sessionAgg.trackedSecondsByGoal.get(goal.id) ?? 0,
			);
			const plannedHrs = roundHours(plannedHours.byGoal.get(goal.id) ?? 0);
			const completionRate =
				goal.targetHours > 0
					? Math.min(100, Math.round((actualHrs / goal.targetHours) * 100))
					: 0;

			return {
				goalId: goal.id,
				title: goal.title,
				status: goal.status,
				category: goal.category,
				targetHours: goal.targetHours,
				requiredCount: goal.requiredCount,
				plannedHours: plannedHrs,
				actualHours: actualHrs,
				completionRate,
				achievementCount: achievementCountByGoal.get(goal.id) ?? 0,
				completedMilestones: completedMs,
				totalMilestones: ms.length,
				nextMilestoneTitle: nextMilestone?.title ?? null,
				nextMilestoneDueDateIso: toIsoString(nextMilestone?.dueDate) ?? null,
			} satisfies StudyGoalProgressView;
		})
		.sort((a, b) => {
			const priority: Record<GoalStatus, number> = {
				active: 0,
				paused: 1,
				completed: 2,
				failed: 3,
			};
			const delta = priority[a.status] - priority[b.status];
			return delta !== 0 ? delta : b.completionRate - a.completionRate;
		});

	// Goal views
	const goalViews: StudyGoalView[] = goalRows.map((g) => ({
		id: g.id,
		title: g.title,
		color: g.color ?? colorFromString(g.id),
		description: g.description,
		category: g.category,
		targetHours: g.targetHours,
		requiredCount: g.requiredCount,
		status: g.status,
		startDateIso: g.startDate.toISOString(),
		endDateIso: g.endDate.toISOString(),
		createdAtIso: g.createdAt.toISOString(),
	}));

	// Rough plans
	const roughPlans: StudyRoughPlanView[] = planRows.map((p) => ({
		id: p.id,
		goalId: p.goalId,
		goalTitle: goalMap.get(p.goalId)?.title ?? "Goal no longer available",
		month: p.month,
		plannedHours: p.plannedHours,
		notes: p.notes,
		createdAtIso: p.createdAt.toISOString(),
	}));

	// Detailed plans (sessions with both start & end - including past sessions for calendar view)
	const detailedPlans: StudySessionView[] = sessionRows
		.filter((s): s is typeof s & { startTime: Date; endTime: Date } =>
			Boolean(s.startTime && s.endTime),
		)
		.sort(
			(a, b) => (a.startTime?.getTime() ?? 0) - (b.startTime?.getTime() ?? 0),
		)
		.map((s) => {
			if (!s.startTime || !s.endTime)
				throw new AppError(ErrorCode.PLANNED_SESSION_INCOMPLETE);
			return toSessionView(
				{ ...s, startTime: s.startTime, endTime: s.endTime },
				goalMap,
				importColorMap,
				now,
			);
		});

	// Recent sessions (completed only)
	const recentSessions: StudySessionView[] = sessionRows
		.filter((s): s is typeof s & { startTime: Date; endTime: Date } =>
			Boolean(s.startTime && s.endTime && s.endTime.getTime() <= now.getTime()),
		)
		.sort((a, b) => b.endTime.getTime() - a.endTime.getTime())
		.slice(0, RECENT_SESSIONS_LIMIT)
		.map((s) => ({
			...toSessionView(s, goalMap, importColorMap, now),
			status: "completed" as const,
		}));

	// Milestones
	const milestonesView: StudyMilestoneView[] = milestoneRows.map((m) => {
		const isCompleted = Boolean(m.completedAt);
		return {
			id: m.id,
			goalId: m.goalId,
			goalTitle: goalMap.get(m.goalId)?.title ?? "Goal no longer available",
			title: m.title,
			dueDateIso: m.dueDate.toISOString(),
			completedAtIso: toIsoString(m.completedAt),
			isCompleted,
			isOverdue: !isCompleted && m.dueDate.getTime() < now.getTime(),
		};
	});

	// Achievements
	const achievementsView: StudyAchievementView[] = achievementRows.map((a) => {
		const goalData = a.goalId ? goalMap.get(a.goalId) : null;
		return {
			id: a.id,
			goalId: a.goalId,
			goalTitle: goalData?.title ?? null,
			category: a.category,
			name: a.name,
			achievedAtIso: a.achievedAt.toISOString(),
			grade: a.grade,
			points: a.points,
			notes: a.notes,
		};
	});

	// Calendar imports
	const calendarImportsView: StudyCalendarImportView[] = importRows.map(
		(e) => ({
			id: e.id,
			name: e.name,
			color: e.color,
			visible: e.visible ?? true,
			notificationsEnabled: e.notificationsEnabled ?? true,
			createdAtIso: e.createdAt.toISOString(),
		}),
	);

	// Active session
	const activeSessionRow = activeRows[0] ?? null;
	const activeSession: StudyActiveSessionView | null = activeSessionRow
		? {
				id: activeSessionRow.id,
				goalId: activeSessionRow.goalId ?? null,
				goalTitle: activeSessionRow.goalId
					? (goalMap.get(activeSessionRow.goalId)?.title ??
						"Goal no longer available")
					: (activeSessionRow.name ?? "No goal"),
				color:
					activeSessionRow.color ??
					(activeSessionRow.goalId
						? (goalMap.get(activeSessionRow.goalId)?.color ??
							colorFromString(activeSessionRow.goalId))
						: activeSessionRow.importId
							? (importColorMap.get(activeSessionRow.importId) ??
								colorFromString(activeSessionRow.id))
							: colorFromString(activeSessionRow.id)),
				startIso:
					activeSessionRow.startTime?.toISOString() ?? now.toISOString(),
				notes: activeSessionRow.notes,
				elapsedSec: Math.max(
					0,
					Math.floor(
						(now.getTime() - (activeSessionRow.startTime ?? now).getTime()) /
							1000,
					),
				),
			}
		: null;

	// Summary
	const completedMilestones = milestonesView.filter(
		(m) => m.isCompleted,
	).length;
	const overdueMilestones = milestonesView.filter((m) => m.isOverdue).length;

	return {
		generatedAtIso: now.toISOString(),
		summary: {
			totalTargetHours: goalRows.reduce((sum, g) => sum + g.targetHours, 0),
			totalTrackedHours: secondsToHours(sessionAgg.totalTrackedSeconds),
			plannedHoursSixMonths,
			actualHoursSixMonths,
			planAdherenceRate:
				plannedHoursSixMonths > 0
					? Math.min(
							100,
							Math.round((actualHoursSixMonths / plannedHoursSixMonths) * 100),
						)
					: 0,
			activeGoals: goalRows.filter((g) => g.status === "active").length,
			completedGoals: goalRows.filter((g) => g.status === "completed").length,
			completedMilestones,
			achievementCount: achievementsView.length,
			lectureHours: secondsToHours(sessionAgg.lectureSeconds),
			learningHours: secondsToHours(sessionAgg.learningSeconds),
		},
		attention: {
			missedPlannedSessions: sessionAgg.missedPlannedSessions,
			overdueMilestones,
			inactiveForDays: sessionAgg.lastCompletedSessionDate
				? getDaysSince(sessionAgg.lastCompletedSessionDate, now)
				: null,
		},
		goals: goalViews,
		goalProgress,
		roughPlans,
		detailedPlans,
		recentSessions,
		activeSession,
		milestones: milestonesView,
		achievements: achievementsView,
		calendarImports: calendarImportsView,
		schedule: timeline,
	};
}

// ── Server function ───────────────────────────────────────────────────

export const getStudyDashboardSnapshot = createServerFn({ method: "GET" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.handler(async ({ context }) => {
		return collectStudyDashboardSnapshot(context.userId);
	});
