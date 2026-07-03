import { describe, expect, it } from "vitest";
import { AppError, ErrorCode } from "#/lib/errors/app-error";
import { MAX_GOAL_DURATION_DAYS } from "#/lib/server/study-manager/constants";
import { ensureGoalWindow } from "#/lib/server/study-manager/services/goal.service";

describe("goal service", () => {
	describe("ensureGoalWindow", () => {
		it("should not throw for valid date range (30 days)", () => {
			const startDate = new Date("2025-01-01T00:00:00Z");
			const endDate = new Date("2025-01-31T00:00:00Z");

			expect(() => ensureGoalWindow(startDate, endDate)).not.toThrow();
		});

		it("should throw when endDate equals startDate", () => {
			const date = new Date("2025-01-01T00:00:00Z");

			expect(() => ensureGoalWindow(date, date)).toThrow(AppError);
			expect(() => ensureGoalWindow(date, date)).toThrow(
				expect.objectContaining({ code: ErrorCode.END_BEFORE_START }),
			);
		});

		it("should throw when endDate is before startDate", () => {
			const startDate = new Date("2025-01-31T00:00:00Z");
			const endDate = new Date("2025-01-01T00:00:00Z");

			expect(() => ensureGoalWindow(startDate, endDate)).toThrow(AppError);
			expect(() => ensureGoalWindow(startDate, endDate)).toThrow(
				expect.objectContaining({ code: ErrorCode.END_BEFORE_START }),
			);
		});

		it("should not throw for exactly MAX_GOAL_DURATION_DAYS (186 days)", () => {
			const startDate = new Date("2025-01-01T00:00:00Z");
			// Add exactly 186 days
			const endDate = new Date(
				startDate.getTime() + MAX_GOAL_DURATION_DAYS * 24 * 60 * 60 * 1000,
			);

			expect(() => ensureGoalWindow(startDate, endDate)).not.toThrow();
		});

		// -- Edge cases
		it("should throw when duration exceeds MAX_GOAL_DURATION_DAYS (187 days)", () => {
			const startDate = new Date("2025-01-01T00:00:00Z");
			// Add 187 days (1 day over the limit)
			const endDate = new Date(
				startDate.getTime() +
					(MAX_GOAL_DURATION_DAYS + 1) * 24 * 60 * 60 * 1000,
			);

			expect(() => ensureGoalWindow(startDate, endDate)).toThrow(AppError);
			expect(() => ensureGoalWindow(startDate, endDate)).toThrow(
				expect.objectContaining({ code: ErrorCode.GOAL_TOO_LONG }),
			);
		});

		it("should not throw for short duration (1 day)", () => {
			const startDate = new Date("2025-01-01T00:00:00Z");
			const endDate = new Date("2025-01-02T00:00:00Z");

			expect(() => ensureGoalWindow(startDate, endDate)).not.toThrow();
		});

		it("should handle millisecond precision in date comparison", () => {
			const startDate = new Date("2025-01-01T00:00:00.000Z");
			const endDate = new Date("2025-01-01T00:00:00.001Z");

			// Very small duration, but endDate > startDate, so should not throw
			expect(() => ensureGoalWindow(startDate, endDate)).not.toThrow();
		});

		it("should throw for duration just slightly over MAX_GOAL_DURATION_DAYS", () => {
			const startDate = new Date("2025-01-01T00:00:00Z");
			// Add MAX_GOAL_DURATION_DAYS + 1 millisecond
			const endDate = new Date(
				startDate.getTime() + MAX_GOAL_DURATION_DAYS * 24 * 60 * 60 * 1000 + 1,
			);

			expect(() => ensureGoalWindow(startDate, endDate)).toThrow(AppError);
			expect(() => ensureGoalWindow(startDate, endDate)).toThrow(
				expect.objectContaining({ code: ErrorCode.GOAL_TOO_LONG }),
			);
		});

		it("should handle very large valid range (180 days)", () => {
			const startDate = new Date("2025-01-01T00:00:00Z");
			const endDate = new Date(startDate.getTime() + 180 * 24 * 60 * 60 * 1000);

			expect(() => ensureGoalWindow(startDate, endDate)).not.toThrow();
		});

		it("should correctly identify END_BEFORE_START error code", () => {
			const startDate = new Date("2025-01-02T00:00:00Z");
			const endDate = new Date("2025-01-01T00:00:00Z");

			try {
				ensureGoalWindow(startDate, endDate);
				throw new Error("Should have thrown");
			} catch (err) {
				if (err instanceof AppError) {
					expect(err.code).toBe(ErrorCode.END_BEFORE_START);
				} else {
					throw err;
				}
			}
		});

		it("should correctly identify GOAL_TOO_LONG error code", () => {
			const startDate = new Date("2025-01-01T00:00:00Z");
			const endDate = new Date(
				startDate.getTime() +
					(MAX_GOAL_DURATION_DAYS + 1) * 24 * 60 * 60 * 1000,
			);

			try {
				ensureGoalWindow(startDate, endDate);
				throw new Error("Should have thrown");
			} catch (err) {
				if (err instanceof AppError) {
					expect(err.code).toBe(ErrorCode.GOAL_TOO_LONG);
				} else {
					throw err;
				}
			}
		});
	});
});
