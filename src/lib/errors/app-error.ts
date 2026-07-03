/**
 * Centralized error code registry.
 *
 * User-facing error strings are resolved via i18n at call time,
 * so they always reflect the current language.
 */

import i18n from "#/lib/i18n";

export const ErrorCode = {
	// ── Auth ───────────────────────────────────────────────────────────
	INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
	INVALID_ORIGIN: "INVALID_ORIGIN",
	ACCOUNT_EXISTS: "ACCOUNT_EXISTS",
	RATE_LIMITED: "RATE_LIMITED",
	AUTH_FAILED: "AUTH_FAILED",
	LOGIN_INCOMPLETE: "LOGIN_INCOMPLETE",
	PASSWORD_CHANGE_FAILED: "PASSWORD_CHANGE_FAILED",

	// ── Service health ────────────────────────────────────────────────
	SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

	// ── Validation ────────────────────────────────────────────────────
	INVALID_DATE: "INVALID_DATE",
	INVALID_MONTH_FORMAT: "INVALID_MONTH_FORMAT",
	END_BEFORE_START: "END_BEFORE_START",
	GOAL_TOO_LONG: "GOAL_TOO_LONG",
	SESSION_TOO_SHORT: "SESSION_TOO_SHORT",
	MONTH_OUTSIDE_GOAL: "MONTH_OUTSIDE_GOAL",
	MILESTONE_OUTSIDE_GOAL: "MILESTONE_OUTSIDE_GOAL",

	// ── Not found / ownership ─────────────────────────────────────────
	GOAL_NOT_FOUND: "GOAL_NOT_FOUND",
	PLANNED_SESSION_NOT_FOUND: "PLANNED_SESSION_NOT_FOUND",
	PLANNED_SESSION_INCOMPLETE: "PLANNED_SESSION_INCOMPLETE",
	MILESTONE_NOT_FOUND: "MILESTONE_NOT_FOUND",
	SESSION_NOT_FOUND: "SESSION_NOT_FOUND",

	// ── Conflict ──────────────────────────────────────────────────────
	FOCUS_SESSION_ALREADY_RUNNING: "FOCUS_SESSION_ALREADY_RUNNING",
	ACTIVE_SESSION_NOT_EDITABLE: "ACTIVE_SESSION_NOT_EDITABLE",
	ACTIVE_SESSION_NOT_DELETABLE: "ACTIVE_SESSION_NOT_DELETABLE",
	IMPORTED_SESSION_LOCKED: "IMPORTED_SESSION_LOCKED",
	PLANNED_SESSION_ALREADY_STARTED: "PLANNED_SESSION_ALREADY_STARTED",
	PLANNED_SESSION_WRONG_GOAL: "PLANNED_SESSION_WRONG_GOAL",
	NO_ACTIVE_FOCUS_SESSION: "NO_ACTIVE_FOCUS_SESSION",
	MILESTONES_OUTSIDE_GOAL: "MILESTONES_OUTSIDE_GOAL",
	ICS_IMPORT_EMPTY: "ICS_IMPORT_EMPTY",

	// ── Generic ───────────────────────────────────────────────────────
	UNKNOWN: "UNKNOWN",
	LOAD_FAILED: "LOAD_FAILED",

	// ── Not found (additional) ────────────────────────────────────────
	ROUGH_PLAN_NOT_FOUND: "ROUGH_PLAN_NOT_FOUND",
	DETAILED_PLAN_NOT_FOUND: "DETAILED_PLAN_NOT_FOUND",
	TIME_ENTRY_NOT_FOUND: "TIME_ENTRY_NOT_FOUND",
	OUTCOME_NOT_FOUND: "OUTCOME_NOT_FOUND",
	CALENDAR_IMPORT_NOT_FOUND: "CALENDAR_IMPORT_NOT_FOUND",

	// ── Profile ───────────────────────────────────────────────────────
	PROFILE_UPDATE_FAILED: "PROFILE_UPDATE_FAILED",
	EMAIL_UPDATE_FAILED: "EMAIL_UPDATE_FAILED",
	NAME_UPDATE_FAILED: "NAME_UPDATE_FAILED",
	// ── Admin ────────────────────────────────────────────────────────
	FORBIDDEN: "FORBIDDEN",
	BANNED_USER: "BANNED_USER",

	// ── Achievement ───────────────────────────────────────────────────────
	ACHIEVEMENT_NAME_REQUIRED: "ACHIEVEMENT_NAME_REQUIRED",
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Single source of truth for all user-facing error messages.
 *
 * To add i18n later, replace this map with a lookup like:
 *   `t(`errors.${code}`, params)`
 */
const messages: Record<ErrorCodeValue, string> = {
	// Auth
	[ErrorCode.INVALID_CREDENTIALS]: "Invalid email or password.",
	[ErrorCode.INVALID_ORIGIN]:
		"Request origin not allowed. Check your app URL configuration.",
	[ErrorCode.ACCOUNT_EXISTS]: "An account with this email already exists.",
	[ErrorCode.RATE_LIMITED]:
		"Too many attempts. Please wait a moment and try again.",
	[ErrorCode.AUTH_FAILED]: "Authentication failed. Please try again.",
	[ErrorCode.LOGIN_INCOMPLETE]: "Login was not completed. Please try again.",
	[ErrorCode.PASSWORD_CHANGE_FAILED]:
		"Password change failed. Check your current password.",

	// Service health
	[ErrorCode.SERVICE_UNAVAILABLE]:
		"Service is temporarily unavailable. Please try again shortly.",

	// Validation
	[ErrorCode.INVALID_DATE]: "The provided date is not valid.",
	[ErrorCode.INVALID_MONTH_FORMAT]: "Month must match the format YYYY-MM.",
	[ErrorCode.END_BEFORE_START]: "End date must be after start date.",
	[ErrorCode.GOAL_TOO_LONG]: "A goal can span at most six months.",
	[ErrorCode.SESSION_TOO_SHORT]:
		"Detailed sessions must be at least 15 minutes.",
	[ErrorCode.MONTH_OUTSIDE_GOAL]:
		"The selected month is outside the goal period.",
	[ErrorCode.MILESTONE_OUTSIDE_GOAL]:
		"Milestone due date must be within the goal period.",

	// Not found / ownership
	[ErrorCode.GOAL_NOT_FOUND]: "The selected goal could not be found.",
	[ErrorCode.PLANNED_SESSION_NOT_FOUND]:
		"The selected planned session could not be found.",
	[ErrorCode.PLANNED_SESSION_INCOMPLETE]: "Planned session data is incomplete.",
	[ErrorCode.MILESTONE_NOT_FOUND]: "The selected milestone could not be found.",
	[ErrorCode.SESSION_NOT_FOUND]: "The selected session could not be found.",

	// Conflict
	[ErrorCode.FOCUS_SESSION_ALREADY_RUNNING]:
		"A focus session is already running. Stop it before starting a new one.",
	[ErrorCode.ACTIVE_SESSION_NOT_EDITABLE]:
		"An active session cannot be edited. Stop it first.",
	[ErrorCode.ACTIVE_SESSION_NOT_DELETABLE]:
		"An active session cannot be deleted. Stop it first.",
	[ErrorCode.IMPORTED_SESSION_LOCKED]:
		"This session is managed by a calendar import. Update it from calendar settings.",
	[ErrorCode.PLANNED_SESSION_ALREADY_STARTED]:
		"The selected planned session has already been started.",
	[ErrorCode.PLANNED_SESSION_WRONG_GOAL]:
		"The selected planned session belongs to another goal.",
	[ErrorCode.NO_ACTIVE_FOCUS_SESSION]: "No active focus session is running.",
	[ErrorCode.MILESTONES_OUTSIDE_GOAL]:
		"One or more intermediate goals are outside the new goal period.",
	[ErrorCode.ICS_IMPORT_EMPTY]: "No events were found in the calendar file.",

	// Generic
	[ErrorCode.UNKNOWN]: "Something went wrong. Please try again.",
	[ErrorCode.LOAD_FAILED]: "Unable to load study data right now.",

	// Not found (additional)
	[ErrorCode.ROUGH_PLAN_NOT_FOUND]:
		"The selected rough plan entry could not be found.",
	[ErrorCode.DETAILED_PLAN_NOT_FOUND]:
		"The selected detailed plan entry could not be found.",
	[ErrorCode.TIME_ENTRY_NOT_FOUND]:
		"The selected time entry could not be found.",
	[ErrorCode.OUTCOME_NOT_FOUND]: "The selected outcome could not be found.",
	[ErrorCode.CALENDAR_IMPORT_NOT_FOUND]:
		"The selected calendar import could not be found.",

	// Profile
	[ErrorCode.PROFILE_UPDATE_FAILED]:
		"Unable to update profile. Please try again.",
	[ErrorCode.EMAIL_UPDATE_FAILED]: "Unable to update your email right now.",
	[ErrorCode.NAME_UPDATE_FAILED]: "Unable to update your name right now.",

	// Admin
	[ErrorCode.FORBIDDEN]: "You do not have permission to perform this action.",
	[ErrorCode.BANNED_USER]:
		"Your account has been suspended. Please contact support if you believe this is an error.",

	// Achievement
	[ErrorCode.ACHIEVEMENT_NAME_REQUIRED]:
		"A name is required when no goal is selected.",
};

/**
 * Look up the user-facing message for a known error code.
 *
 * Uses i18n with the hardcoded English message as fallback (displayed when
 * the translation key is missing or i18n is not yet initialized).
 */
export function getErrorMessage(code: ErrorCodeValue): string {
	return i18n.t(`errors.${code}`, messages[code]);
}

/**
 * Custom error class that carries a typed error code.
 *
 * Thrown from server functions so the client can match on `code` instead of
 * fragile message substrings.
 */
export class AppError extends Error {
	readonly code: ErrorCodeValue;

	constructor(code: ErrorCodeValue, message?: string) {
		super(message ?? messages[code]);
		this.name = "AppError";
		this.code = code;
	}
}
