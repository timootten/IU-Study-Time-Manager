import { AppError, ErrorCode } from "#/lib/errors/app-error";

import { MONTH_PATTERN } from "../constants";

// ── Formatting ────────────────────────────────────────────────────────

export function formatDateLabel(date: Date): string {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		year: "numeric",
	}).format(date);
}

export function formatWeekLabel(weekStart: Date): string {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
	}).format(weekStart);
}

// ── Conversion ────────────────────────────────────────────────────────

/** Safely convert a nullable Date to an ISO string, returning `null` if absent. */
export function toIsoString(value: Date | null | undefined): string | null {
	return value?.toISOString() ?? null;
}

/** Parse a date string or throw an `AppError` with the field name in the message. */
export function parseDateOrThrow(rawDate: string, fieldName: string): Date {
	const parsed = new Date(rawDate);

	if (Number.isNaN(parsed.getTime())) {
		throw new AppError(
			ErrorCode.INVALID_DATE,
			`${fieldName} is not a valid date.`,
		);
	}

	return parsed;
}

// ── Key generation ────────────────────────────────────────────────────

/** Return a `YYYY-MM` key from a Date (UTC). */
export function getMonthKey(date: Date): string {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	return `${year}-${month}`;
}

/** Return a `YYYY-MM-DD` key from a Date (UTC). */
export function toUtcDateKey(date: Date): string {
	return date.toISOString().slice(0, 10);
}

// ── Week helpers ──────────────────────────────────────────────────────

/** Get the Monday (UTC) of the week containing `date`. */
export function getWeekStartUtc(date: Date): Date {
	const weekStart = new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
	);
	const currentDay = weekStart.getUTCDay();
	const offset = currentDay === 0 ? -6 : 1 - currentDay;
	weekStart.setUTCDate(weekStart.getUTCDate() + offset);
	return weekStart;
}

/** Return an array of week-start Dates for the last `count` weeks. */
export function getWeekWindow(now: Date, count: number): Date[] {
	const thisWeekStart = getWeekStartUtc(now);
	const weeks: Date[] = [];

	for (let index = count - 1; index >= 0; index -= 1) {
		const entry = new Date(thisWeekStart);
		entry.setUTCDate(thisWeekStart.getUTCDate() - index * 7);
		weeks.push(entry);
	}

	return weeks;
}

// ── Month helpers ─────────────────────────────────────────────────────

/**
 * Parse a `YYYY-MM` key into the first and last instants of that month (UTC).
 * Throws if the format is invalid.
 */
export function getMonthRange(monthKey: string): {
	monthStart: Date;
	monthEnd: Date;
} {
	if (!MONTH_PATTERN.test(monthKey)) {
		throw new AppError(ErrorCode.INVALID_MONTH_FORMAT);
	}

	const [rawYear, rawMonth] = monthKey.split("-");
	const year = Number(rawYear);
	const month = Number(rawMonth);
	const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
	const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

	return { monthStart, monthEnd };
}

/** Return the last `count` months as `{ month, firstDay }` pairs (UTC). */
export function getPreviousMonths(
	now: Date,
	count: number,
): Array<{ month: string; firstDay: Date }> {
	const months: Array<{ month: string; firstDay: Date }> = [];

	for (let i = count - 1; i >= 0; i -= 1) {
		const current = new Date(
			Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
		);
		months.push({ month: getMonthKey(current), firstDay: current });
	}

	return months;
}

// ── Misc ──────────────────────────────────────────────────────────────

/** Calculate the number of full days between two dates. */
export function getDaysSince(lastDate: Date, now: Date): number {
	const msPerDay = 24 * 60 * 60 * 1000;
	return Math.max(
		0,
		Math.floor((now.getTime() - lastDate.getTime()) / msPerDay),
	);
}
