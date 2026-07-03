// ── Types ─────────────────────────────────────────────────────────────
export type {
	GoalCategory,
	GoalStatus,
	SessionCategory,
	SessionSource,
	SessionStatus,
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
} from "./types";

// ── Server functions ──────────────────────────────────────────────────

// Achievements
export {
	createStudyAchievement,
	deleteStudyAchievement,
	updateStudyAchievement,
} from "./handlers/achievements";
// Calendar imports
export {
	createCalendarImports,
	deleteCalendarImport,
	updateCalendarImport,
} from "./handlers/calendar-imports";
// Dashboard
export { getStudyDashboardSnapshot } from "./handlers/dashboard";
// Goals
export {
	createStudyGoal,
	deleteStudyGoal,
	updateStudyGoal,
	updateStudyGoalStatus,
} from "./handlers/goals";
// Milestones
export {
	createStudyMilestone,
	deleteStudyMilestone,
	toggleStudyMilestoneCompletion,
	updateStudyMilestone,
} from "./handlers/milestones";
// Monthly plans
export {
	deleteStudyMonthlyPlan,
	updateStudyMonthlyPlan,
	upsertStudyMonthlyPlan,
} from "./handlers/monthly-plans";
// Sessions / detailed plans
export {
	createStudyDetailedPlan,
	deleteStudySession,
	updateStudyDetailedPlan,
} from "./handlers/sessions";
// Timer / manual time
export {
	addStudyManualTimeEntry,
	startStudyFocusSession,
	stopStudyFocusSession,
	updateStudyTimeEntry,
} from "./handlers/timer";
