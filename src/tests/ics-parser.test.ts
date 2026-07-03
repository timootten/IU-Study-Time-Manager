import { describe, expect, it } from "vitest";
import {
	buildIcsNotes,
	parseIcsEvents,
} from "#/lib/server/study-manager/utils/ics-parser";

describe("ICS parser utilities", () => {
	describe("parseIcsEvents", () => {
		it("should return empty array for empty string", () => {
			expect(parseIcsEvents("")).toEqual([]);
		});

		it("should parse single VEVENT from valid ICS", () => {
			const icsText = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250315T090000Z
DTEND:20250315T110000Z
SUMMARY:Mathe Lerneinheit
DESCRIPTION:Kapitel 3
LOCATION:Bibliothek
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsEvents(icsText);
			expect(result).toHaveLength(1);
			expect(result[0].summary).toBe("Mathe Lerneinheit");
			expect(result[0].description).toBe("Kapitel 3");
			expect(result[0].location).toBe("Bibliothek");
		});

		it("should parse correct start and end dates", () => {
			const icsText = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250315T090000Z
DTEND:20250315T110000Z
SUMMARY:Test Event
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsEvents(icsText);
			expect(result[0].start.toISOString()).toBe("2025-03-15T09:00:00.000Z");
			expect(result[0].end.toISOString()).toBe("2025-03-15T11:00:00.000Z");
		});

		it("should set end to start + 1h when DTEND is missing", () => {
			const icsText = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250315T090000Z
SUMMARY:No End Time
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsEvents(icsText);
			expect(result[0].end.getTime()).toBe(
				result[0].start.getTime() + 60 * 60 * 1000,
			);
		});

		it("should set end to start + 1h when DTEND is before DTSTART", () => {
			const icsText = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250315T110000Z
DTEND:20250315T090000Z
SUMMARY:Invalid Time Range
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsEvents(icsText);
			expect(result[0].end.getTime()).toBe(
				result[0].start.getTime() + 60 * 60 * 1000,
			);
		});

		it("should decode escaped newlines in SUMMARY", () => {
			const icsText = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250315T090000Z
SUMMARY:Mathe\\nLerneinheit
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsEvents(icsText);
			expect(result[0].summary).toBe("Mathe\nLerneinheit");
		});

		it("should decode escaped commas", () => {
			const icsText = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250315T090000Z
DESCRIPTION:Punkt A\\, Punkt B
SUMMARY:Test
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsEvents(icsText);
			expect(result[0].description).toBe("Punkt A, Punkt B");
		});

		it("should decode escaped newlines in DESCRIPTION", () => {
			const icsText = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250315T090000Z
DESCRIPTION:Kapitel 3\\nIntegrale
SUMMARY:Test
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsEvents(icsText);
			expect(result[0].description).toBe("Kapitel 3\nIntegrale");
		});

		it("should skip VEVENT without DTSTART", () => {
			const icsText = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:No Start Date
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsEvents(icsText);
			expect(result).toHaveLength(0);
		});

		it("should parse multiple VEVENTs", () => {
			const icsText = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250315T090000Z
SUMMARY:Event 1
END:VEVENT
BEGIN:VEVENT
DTSTART:20250315T140000Z
SUMMARY:Event 2
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsEvents(icsText);
			expect(result).toHaveLength(2);
			expect(result[0].summary).toBe("Event 1");
			expect(result[1].summary).toBe("Event 2");
		});

		it("should handle null description and location", () => {
			const icsText = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250315T090000Z
SUMMARY:Minimal Event
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsEvents(icsText);
			expect(result[0].description).toBeNull();
			expect(result[0].location).toBeNull();
		});

		// -- Edge cases
		it("should trim whitespace from fields", () => {
			const icsText = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250315T090000Z
SUMMARY:  Trimmed Event  
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsEvents(icsText);
			expect(result[0].summary).toBe("Trimmed Event");
		});

		it("should use default summary 'Imported session' if SUMMARY is missing", () => {
			const icsText = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250315T090000Z
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsEvents(icsText);
			expect(result[0].summary).toBe("Imported session");
		});

		it("should handle line folding (RFC 5545)", () => {
			const icsText = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250315T090000Z
SUMMARY:This is a very long summary that is
 continued on the next line
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsEvents(icsText);
			expect(result[0].summary).toContain("This is a very long summary");
		});

		it("should handle CRLF line endings", () => {
			const icsText = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART:20250315T090000Z\r\nSUMMARY:Test\r\nEND:VEVENT\r\nEND:VCALENDAR`;

			const result = parseIcsEvents(icsText);
			expect(result).toHaveLength(1);
			expect(result[0].summary).toBe("Test");
		});
	});

	describe("buildIcsNotes", () => {
		it("should return null for null description and null location", () => {
			expect(buildIcsNotes(null, null)).toBeNull();
		});

		it("should return description when location is null", () => {
			expect(buildIcsNotes("Notiz", null)).toBe("Notiz");
		});

		it("should return formatted location when description is null", () => {
			expect(buildIcsNotes(null, "Raum A")).toBe("Location: Raum A");
		});

		it("should combine location and description with separator", () => {
			expect(buildIcsNotes("Notiz", "Raum A")).toBe(
				"Location: Raum A\n\nNotiz",
			);
		});

		it("should not duplicate location if already in description", () => {
			const result = buildIcsNotes("Location: Raum A\nNotiz", "Raum A");
			expect(result).not.toContain("Location: Raum A\n\nLocation: Raum A");
		});

		it("should filter empty value lines from description", () => {
			const description = "Key: \nOther: Value\n";
			const result = buildIcsNotes(description, null);
			expect(result).not.toContain("Key:");
			expect(result).toContain("Other: Value");
		});

		// -- Edge cases
		it("should handle multiline description", () => {
			const description = "Line 1\nLine 2\nLine 3";
			const result = buildIcsNotes(description, null);
			expect(result).toBe("Line 1\nLine 2\nLine 3");
		});

		it("should trim whitespace from description", () => {
			const result = buildIcsNotes("  Notiz  ", null);
			expect(result).toBe("Notiz");
		});

		it("should handle empty string description", () => {
			const result = buildIcsNotes("", null);
			expect(result).toBeNull();
		});

		it("should handle location comparison case-insensitively", () => {
			const result = buildIcsNotes("location: raum a\nNotiz", "RAUM A");
			expect(result).not.toContain("Location: RAUM A");
		});

		it("should preserve multiple empty lines in description", () => {
			const description = "Paragraph 1\n\nParagraph 2";
			const result = buildIcsNotes(description, null);
			expect(result).toBe("Paragraph 1\n\nParagraph 2");
		});
	});
});
