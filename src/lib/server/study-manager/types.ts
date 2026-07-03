import type {
	GOAL_CATEGORIES,
	GOAL_STATUSES,
	SESSION_CATEGORIES,
	SESSION_SOURCES,
} from "./constants";

// ── Literal union types (derived from constants) ──────────────────────

export type GoalStatus = (typeof GOAL_STATUSES)[number];
export type GoalCategory = (typeof GOAL_CATEGORIES)[number];
export type SessionCategory = (typeof SESSION_CATEGORIES)[number];
export type SessionSource = (typeof SESSION_SOURCES)[number];

export type SessionStatus = "planned" | "active" | "completed";

// ── View interfaces (API contracts) ───────────────────────────────────

export interface StudyGoalView {
	id: string;
	title: string;
	color: string;
	description: string | null;
	category: GoalCategory;
	targetHours: number;
	requiredCount: number;
	status: GoalStatus;
	startDateIso: string;
	endDateIso: string;
	createdAtIso: string;
}

export interface StudyGoalProgressView {
	goalId: string;
	title: string;
	status: GoalStatus;
	category: GoalCategory;
	targetHours: number;
	requiredCount: number;
	plannedHours: number;
	actualHours: number;
	completionRate: number;
	achievementCount: number;
	completedMilestones: number;
	totalMilestones: number;
	nextMilestoneTitle: string | null;
	nextMilestoneDueDateIso: string | null;
}

export interface StudyRoughPlanView {
	id: string;
	goalId: string;
	goalTitle: string;
	month: string;
	plannedHours: number;
	notes: string | null;
	createdAtIso: string;
}

export interface StudySessionView {
	id: string;
	goalId: string | null;
	goalTitle: string;
	name: string | null;
	color: string;
	startIso: string;
	endIso: string | null;
	durationSec: number;
	category: SessionCategory;
	countsTowardGoal: boolean;
	notificationsEnabled: boolean;
	notes: string | null;
	status: SessionStatus;
	importId: string | null;
	source: SessionSource;
}

export interface StudyActiveSessionView {
	id: string;
	goalId: string | null;
	goalTitle: string;
	color: string;
	startIso: string;
	notes: string | null;
	elapsedSec: number;
}

export interface StudyCalendarImportView {
	id: string;
	name: string;
	color: string;
	visible: boolean;
	notificationsEnabled: boolean;
	createdAtIso: string;
}

export interface StudyMilestoneView {
	id: string;
	goalId: string;
	goalTitle: string;
	title: string;
	dueDateIso: string;
	completedAtIso: string | null;
	isCompleted: boolean;
	isOverdue: boolean;
}

export interface StudyAchievementView {
	id: string;
	goalId: string | null;
	goalTitle: string | null;
	category: GoalCategory;
	name: string | null;
	achievedAtIso: string;
	grade: string | null;
	points: number | null;
	notes: string | null;
}

export interface StudyMonthlyTimelinePoint {
	month: string;
	label: string;
	plannedHours: number;
	actualHours: number;
}

export interface StudyWeeklyTimelinePoint {
	weekStartIso: string;
	label: string;
	hours: number;
}

export interface StudyDashboardSnapshot {
	generatedAtIso: string;
	summary: {
		totalTargetHours: number;
		totalTrackedHours: number;
		plannedHoursSixMonths: number;
		actualHoursSixMonths: number;
		planAdherenceRate: number;
		activeGoals: number;
		completedGoals: number;
		completedMilestones: number;
		achievementCount: number;
		lectureHours: number;
		learningHours: number;
	};
	attention: {
		missedPlannedSessions: number;
		overdueMilestones: number;
		inactiveForDays: number | null;
	};
	goals: StudyGoalView[];
	goalProgress: StudyGoalProgressView[];
	roughPlans: StudyRoughPlanView[];
	detailedPlans: StudySessionView[];
	recentSessions: StudySessionView[];
	activeSession: StudyActiveSessionView | null;
	milestones: StudyMilestoneView[];
	achievements: StudyAchievementView[];
	calendarImports: StudyCalendarImportView[];
	schedule: {
		nextSixMonths: StudyMonthlyTimelinePoint[];
		weeklyHours: StudyWeeklyTimelinePoint[];
	};
}
