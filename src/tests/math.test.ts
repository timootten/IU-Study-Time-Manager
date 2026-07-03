import { describe, expect, it } from "vitest";
import {
	clamp,
	roundHours,
	secondsToHours,
} from "#/lib/server/study-manager/utils/math";

describe("math utilities", () => {
	describe("clamp", () => {
		it("should return the value when it is within the range", () => {
			expect(clamp(5, 0, 10)).toBe(5);
		});

		it("should return the minimum when value is below the range", () => {
			expect(clamp(-3, 0, 10)).toBe(0);
		});

		it("should return the maximum when value is above the range", () => {
			expect(clamp(15, 0, 10)).toBe(10);
		});

		// -- Edge cases
		it("should return the minimum when value equals the minimum", () => {
			expect(clamp(0, 0, 10)).toBe(0);
		});

		it("should return the maximum when value equals the maximum", () => {
			expect(clamp(10, 0, 10)).toBe(10);
		});

		it("should handle negative ranges", () => {
			expect(clamp(-5, -10, -1)).toBe(-5);
			expect(clamp(-15, -10, -1)).toBe(-10);
			expect(clamp(0, -10, -1)).toBe(-1);
		});

		it("should handle zero range", () => {
			expect(clamp(5, 0, 0)).toBe(0);
		});
	});

	describe("roundHours", () => {
		it("should round up when decimal is >= 0.5", () => {
			expect(roundHours(1.05)).toBe(1.1);
		});

		it("should round down when decimal is < 0.5", () => {
			expect(roundHours(1.04)).toBe(1.0);
		});

		it("should handle zero", () => {
			expect(roundHours(0)).toBe(0);
		});

		// -- Edge cases
		it("should round 1.45 to 1.5 using standard rounding", () => {
			expect(roundHours(1.45)).toBe(1.5);
		});

		it("should round 1.55 to 1.6", () => {
			expect(roundHours(1.55)).toBe(1.6);
		});

		it("should handle large values", () => {
			expect(roundHours(100.15)).toBe(100.2);
			expect(roundHours(1000.04)).toBe(1000.0);
		});

		it("should handle negative values", () => {
			expect(roundHours(-1.15)).toBe(-1.1);
			expect(roundHours(-1.04)).toBe(-1.0);
		});
	});

	describe("secondsToHours", () => {
		it("should convert 3600 seconds to 1.0 hours", () => {
			expect(secondsToHours(3600)).toBe(1.0);
		});

		it("should convert 5400 seconds to 1.5 hours", () => {
			expect(secondsToHours(5400)).toBe(1.5);
		});

		it("should round 100 seconds to 0.0 hours (1 decimal place)", () => {
			expect(secondsToHours(100)).toBe(0.0);
		});

		it("should handle zero seconds", () => {
			expect(secondsToHours(0)).toBe(0);
		});

		// -- Edge cases
		it("should convert 1800 seconds to 0.5 hours", () => {
			expect(secondsToHours(1800)).toBe(0.5);
		});

		it("should convert 7200 seconds to 2.0 hours", () => {
			expect(secondsToHours(7200)).toBe(2.0);
		});

		it("should handle partial seconds with rounding", () => {
			expect(secondsToHours(3660)).toBe(1.0);
			expect(secondsToHours(5436)).toBe(1.5);
		});

		it("should handle large second values", () => {
			expect(secondsToHours(86400)).toBe(24.0); // 24 hours
		});
	});
});
