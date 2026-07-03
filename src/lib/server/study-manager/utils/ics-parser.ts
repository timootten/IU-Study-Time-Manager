// ── ICS (iCalendar) parsing utilities ─────────────────────────────────

export interface IcsEvent {
	start: Date;
	end: Date;
	summary: string;
	description: string | null;
	location: string | null;
}

function decodeIcsValue(value: string): string {
	return value
		.replace(/\\n/gi, "\n")
		.replace(/\\,/g, ",")
		.replace(/\\;/g, ";")
		.replace(/\\\\/g, "\\");
}

function parseIcsDate(rawValue: string): Date | null {
	const trimmed = rawValue.trim();
	if (!trimmed) return null;

	const isUtc = trimmed.endsWith("Z");
	const clean = trimmed.replace(/Z$/, "");
	const match = clean.match(
		/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?$/,
	);
	if (!match) return null;

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const hour = Number(match[4] ?? "0");
	const minute = Number(match[5] ?? "0");
	const second = Number(match[6] ?? "0");

	if ([year, month, day, hour, minute, second].some((n) => Number.isNaN(n))) {
		return null;
	}

	return isUtc
		? new Date(Date.UTC(year, month - 1, day, hour, minute, second))
		: new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Parse VEVENT blocks from raw ICS text.
 * Returns an array of events with start, end, summary, description, and location.
 */
export function parseIcsEvents(icsText: string): IcsEvent[] {
	const unfolded = icsText.replace(/\r?\n[ \t]/g, "").replace(/\r/g, "\n");
	const blocks = unfolded.split("BEGIN:VEVENT").slice(1);
	const events: IcsEvent[] = [];

	for (const block of blocks) {
		const [rawEvent] = block.split("END:VEVENT");
		if (!rawEvent) continue;

		const lines = rawEvent
			.split(/\n/)
			.map((line) => line.trim())
			.filter(Boolean);
		const fields: Record<string, string> = {};

		for (const line of lines) {
			const [rawKey, ...rest] = line.split(":");
			if (!rawKey || rest.length === 0) continue;
			const key = rawKey.split(";")[0]?.toUpperCase();
			if (!key) continue;
			fields[key] = rest.join(":");
		}

		const start = fields.DTSTART ? parseIcsDate(fields.DTSTART) : null;
		if (!start) continue;

		let end = fields.DTEND ? parseIcsDate(fields.DTEND) : null;
		if (!end || end.getTime() <= start.getTime()) {
			end = new Date(start.getTime() + 60 * 60 * 1000);
		}

		const summary = decodeIcsValue(fields.SUMMARY ?? "Imported session");
		const description = fields.DESCRIPTION
			? decodeIcsValue(fields.DESCRIPTION)
			: null;
		const location = fields.LOCATION ? decodeIcsValue(fields.LOCATION) : null;

		events.push({
			start,
			end,
			summary: summary.trim() || "Imported session",
			description: description?.trim() || null,
			location: location?.trim() || null,
		});
	}

	return events;
}

/** Merge ICS description and location into a single notes string. */
export function buildIcsNotes(
	description: string | null,
	location: string | null,
): string | null {
	// Remove lines with empty values (e.g. "Kommentar: " with nothing after the colon)
	const cleanedDescription = description
		? description
				.split("\n")
				.filter((line) => {
					const colonIdx = line.indexOf(":");
					if (colonIdx === -1) return true;
					return line.slice(colonIdx + 1).trim().length > 0;
				})
				.join("\n")
				.trim()
		: null;

	const parts: string[] = [];
	// Only prepend location if it's not already included in the description
	if (
		location &&
		!cleanedDescription?.toLowerCase().includes(location.toLowerCase())
	) {
		parts.push(`Location: ${location}`);
	}
	if (cleanedDescription) parts.push(cleanedDescription);
	return parts.length > 0 ? parts.join("\n\n") : null;
}
