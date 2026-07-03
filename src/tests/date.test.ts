import { describe, expect, it } from "vitest";
import { AppError, ErrorCode } from "#/lib/errors/app-error";
import {
	getDaysSince,
	getMonthKey,
	getMonthRange,
	getPreviousMonths,
	getWeekStartUtc,
	getWeekWindow,
	parseDateOrThrow,
	toIsoString,
	toUtcDateKey,
} from "#/lib/server/study-manager/utils/date";

describe("date utilities", () => {
	describe("getMonthKey", () => {
		it("should return YYYY-MM format for March 15, 2025", () => {
			expect(getMonthKey(new Date("2025-03-15"))).toBe("2025-03");
		});

		it("should return YYYY-MM format for January 1, 2024", () => {
			expect(getMonthKey(new Date("2024-01-01"))).toBe("2024-01");
		});

		// -- Edge cases
		it("should handle December correctly", () => {
			expect(getMonthKey(new Date("2025-12-31"))).toBe("2025-12");
		});

		it("should pad single-digit months with zero", () => {
			expect(getMonthKey(new Date("2025-01-15"))).toBe("2025-01");
			expect(getMonthKey(new Date("2025-09-15"))).toBe("2025-09");
		});
	});

	describe("toUtcDateKey", () => {
		it("should return YYYY-MM-DD format for June 20, 2025 UTC", () => {
			expect(toUtcDateKey(new Date("2025-06-20T14:00:00Z"))).toBe("2025-06-20");
		});

		// -- Edge cases
		it("should handle first day of month", () => {
			expect(toUtcDateKey(new Date("2025-01-01T00:00:00Z"))).toBe("2025-01-01");
		});

		it("should handle last day of month", () => {
			expect(toUtcDateKey(new Date("2025-01-31T23:59:59Z"))).toBe("2025-01-31");
		});

		it("should handle leap year", () => {
			expect(toUtcDateKey(new Date("2024-02-29T12:00:00Z"))).toBe("2024-02-29");
		});
	});

	describe("getWeekStartUtc", () => {
		it("should return Monday for a Wednesday (2025-05-07)", () => {
			const wednesday = new Date("2025-05-07T00:00:00Z");
			const result = getWeekStartUtc(wednesday);
			expect(result.toISOString()).toBe("2025-05-05T00:00:00.000Z");
		});

		it("should return the same Monday when passed a Monday", () => {
			const monday = new Date("2025-05-05T00:00:00Z");
			const result = getWeekStartUtc(monday);
			expect(result.toISOString()).toBe("2025-05-05T00:00:00.000Z");
		});

		it("should return previous Monday when passed a Sunday", () => {
			const sunday = new Date("2025-05-04T00:00:00Z");
			const result = getWeekStartUtc(sunday);
			expect(result.toISOString()).toBe("2025-04-28T00:00:00.000Z");
		});

		// -- Edge cases
		it("should return Monday for a Tuesday", () => {
			const tuesday = new Date("2025-05-06T00:00:00Z");
			const result = getWeekStartUtc(tuesday);
			expect(result.toISOString()).toBe("2025-05-05T00:00:00.000Z");
		});

		it("should return Monday for a Friday", () => {
			const friday = new Date("2025-05-09T00:00:00Z");
			const result = getWeekStartUtc(friday);
			expect(result.toISOString()).toBe("2025-05-05T00:00:00.000Z");
		});

		it("should handle month boundaries", () => {
			const lastDayOfMonth = new Date("2025-04-30T00:00:00Z");
			const result = getWeekStartUtc(lastDayOfMonth);
			expect(result.toISOString()).toBe("2025-04-28T00:00:00.000Z");
		});
	});

	describe("getWeekWindow", () => {
		it("should return array with 3 entries for count=3", () => {
			const now = new Date("2025-05-15T00:00:00Z");
			const result = getWeekWindow(now, 3);
			expect(result).toHaveLength(3);
		});

		it("should have last entry as the current week", () => {
			const now = new Date("2025-05-15T00:00:00Z");
			const result = getWeekWindow(now, 1);
			const expectedMonday = getWeekStartUtc(now);
			expect(result[0].getTime()).toBe(expectedMonday.getTime());
		});

		// -- Edge cases
		it("should return week starts in ascending order", () => {
			const now = new Date("2025-05-15T00:00:00Z");
			const result = getWeekWindow(now, 4);
			for (let i = 1; i < result.length; i++) {
				expect(result[i].getTime()).toBeGreaterThan(result[i - 1].getTime());
			}
		});

		it("should handle count=1", () => {
			const now = new Date("2025-05-15T00:00:00Z");
			const result = getWeekWindow(now, 1);
			expect(result).toHaveLength(1);
		});
	});

	describe("getPreviousMonths", () => {
		it("should return array with 3 entries for count=3", () => {
			const now = new Date("2025-05-15T00:00:00Z");
			const result = getPreviousMonths(now, 3);
			expect(result).toHaveLength(3);
		});

		it("should have correct month keys", () => {
			const now = new Date("2025-05-15T00:00:00Z");
			const result = getPreviousMonths(now, 3);
			expect(result[0].month).toBe("2025-03");
			expect(result[1].month).toBe("2025-04");
			expect(result[2].month).toBe("2025-05");
		});

		it("should have first day of each month", () => {
			const now = new Date("2025-05-15T00:00:00Z");
			const result = getPreviousMonths(now, 2);
			expect(result[0].firstDay.getUTCDate()).toBe(1);
			expect(result[1].firstDay.getUTCDate()).toBe(1);
		});

		// -- Edge cases
		it("should handle year boundaries", () => {
			const now = new Date("2025-02-15T00:00:00Z");
			const result = getPreviousMonths(now, 3);
			expect(result[0].month).toBe("2024-12");
			expect(result[1].month).toBe("2025-01");
			expect(result[2].month).toBe("2025-02");
		});
	});

	describe("getDaysSince", () => {
		it("should return 1 for yesterday to today", () => {
			const yesterday = new Date("2025-05-14T00:00:00Z");
			const today = new Date("2025-05-15T00:00:00Z");
			expect(getDaysSince(yesterday, today)).toBe(1);
		});

		it("should return 0 for same date", () => {
			const date = new Date("2025-05-15T00:00:00Z");
			expect(getDaysSince(date, date)).toBe(0);
		});

		// -- Edge cases
		it("should return 0 for future date (never negative)", () => {
			const future = new Date("2025-05-20T00:00:00Z");
			const today = new Date("2025-05-15T00:00:00Z");
			expect(getDaysSince(future, today)).toBe(0);
		});

		it("should calculate 7 days correctly", () => {
			const sevenDaysAgo = new Date("2025-05-08T00:00:00Z");
			const today = new Date("2025-05-15T00:00:00Z");
			expect(getDaysSince(sevenDaysAgo, today)).toBe(7);
		});

		it("should ignore time components and count only full days", () => {
			const yesterday23_59 = new Date("2025-05-14T23:59:59Z");
			const today00_00 = new Date("2025-05-15T00:00:00Z");
			expect(getDaysSince(yesterday23_59, today00_00)).toBe(0);
		});
	});

	describe("getMonthRange", () => {
		it("should return correct start and end for January 2025", () => {
			const result = getMonthRange("2025-01");
			expect(result.monthStart.toISOString()).toBe("2025-01-01T00:00:00.000Z");
			expect(result.monthEnd.toISOString()).toBe("2025-01-31T23:59:59.999Z");
		});

		it("should return correct end for February 2024 (leap year)", () => {
			const result = getMonthRange("2024-02");
			expect(result.monthEnd.toISOString()).toBe("2024-02-29T23:59:59.999Z");
		});

		it("should throw AppError for invalid format", () => {
			expect(() => getMonthRange("invalid")).toThrow(AppError);
			expect(() => getMonthRange("invalid")).toThrow(
				expect.objectContaining({ code: ErrorCode.INVALID_MONTH_FORMAT }),
			);
		});

		// -- Edge cases
		it("should throw AppError for month 00", () => {
			expect(() => getMonthRange("2025-00")).toThrow(AppError);
		});

		it("should throw AppError for month 13", () => {
			expect(() => getMonthRange("2025-13")).toThrow(AppError);
		});

		it("should throw AppError for invalid format 2025/01", () => {
			expect(() => getMonthRange("2025/01")).toThrow(AppError);
		});
	});

	describe("parseDateOrThrow", () => {
		it("should return Date object for valid ISO string", () => {
			const result = parseDateOrThrow("2025-01-01", "startDate");
			expect(result).toBeInstanceOf(Date);
			expect(result.toISOString()).toBe("2025-01-01T00:00:00.000Z");
		});

		it("should throw AppError for invalid date string", () => {
			expect(() => parseDateOrThrow("kein-datum", "startDate")).toThrow(
				AppError,
			);
			expect(() => parseDateOrThrow("kein-datum", "startDate")).toThrow(
				expect.objectContaining({ code: ErrorCode.INVALID_DATE }),
			);
		});

		// -- Edge cases
		it("should parse full ISO datetime", () => {
			const result = parseDateOrThrow("2025-01-01T12:30:45.123Z", "timestamp");
			expect(result.toISOString()).toBe("2025-01-01T12:30:45.123Z");
		});

		it("should include field name in error message", () => {
			try {
				parseDateOrThrow("invalid", "myField");
			} catch (err) {
				if (err instanceof AppError) {
					expect(err.message).toContain("myField");
				}
			}
		});

		it("should throw for empty string", () => {
			expect(() => parseDateOrThrow("", "date")).toThrow(AppError);
		});
	});

	describe("toIsoString", () => {
		it("should return null for null input", () => {
			expect(toIsoString(null)).toBe(null);
		});

		it("should return null for undefined input", () => {
			expect(toIsoString(undefined)).toBe(null);
		});

		it("should return ISO string for valid Date", () => {
			const date = new Date("2025-01-01T00:00:00Z");
			expect(toIsoString(date)).toBe("2025-01-01T00:00:00.000Z");
		});

		// -- Edge cases
		it("should handle dates with milliseconds", () => {
			const date = new Date("2025-01-01T12:30:45.789Z");
			expect(toIsoString(date)).toBe("2025-01-01T12:30:45.789Z");
		});
	});
});
