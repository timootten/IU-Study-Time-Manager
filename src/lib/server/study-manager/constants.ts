// ── Enum value arrays ─────────────────────────────────────────────────
// Kept in sync with the pgEnum definitions in db/schema.ts.
// Used for Zod validation and TypeScript literal types.

export const GOAL_STATUSES = [
	"active",
	"completed",
	"failed",
	"paused",
] as const;
export const GOAL_CATEGORIES = [
	"exam",
	"project",
	"presentation",
	"other",
] as const;
export const SESSION_CATEGORIES = ["course", "learning", "other"] as const;
export const SESSION_SOURCES = ["manual", "ics"] as const;

// ── Patterns ──────────────────────────────────────────────────────────

/** Matches `YYYY-MM` format with valid month range (01–12). */
export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Matches a 6-digit hex color code like `#a3f0c1`. */
export const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Matches a German-style decimal grade like `1.3` or `4.0`. */
export const GRADE_PATTERN = /^\d\.\d$/;

// ── Thresholds & limits ───────────────────────────────────────────────

/** Minutes after a planned session start before it's flagged as missed. */
export const OVERDUE_SESSION_THRESHOLD_MINUTES = 15;

/** Number of weeks shown in the weekly analytics chart. */
export const ANALYTICS_WEEK_WINDOW = 10;

/** Maximum duration of a goal in days. */
export const MAX_GOAL_DURATION_DAYS = 186;

/** Minimum session duration in minutes. */
export const MIN_SESSION_DURATION_MINUTES = 15;

/** Maximum events imported from a single ICS file. */
export const MAX_ICS_EVENTS_PER_IMPORT = 500;

/** Number of recent sessions returned in the dashboard snapshot. */
export const RECENT_SESSIONS_LIMIT = 12;

/** Maximum sessions fetched for dashboard aggregation. */
export const DASHBOARD_SESSION_LIMIT = 600;

/** Maximum achievements fetched for dashboard aggregation. */
export const DASHBOARD_ACHIEVEMENT_LIMIT = 120;

/** Number of months shown in the monthly timeline. */
export const MONTHLY_TIMELINE_WINDOW = 5;

/** Grade threshold for a passing achievement (≤ 4.0 passes). */
export const PASSING_GRADE_THRESHOLD = "4.1";
