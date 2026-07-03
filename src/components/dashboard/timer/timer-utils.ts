export function formatDuration(seconds: number) {
	const normalized = Math.max(0, Math.floor(seconds));
	const hours = Math.floor(normalized / 3600);
	const minutes = Math.floor((normalized % 3600) / 60);
	const remainingSeconds = normalized % 60;
	return [hours, minutes, remainingSeconds]
		.map((unit) => String(unit).padStart(2, "0"))
		.join(":");
}

export function formatHours(value: number) {
	return `${value.toFixed(1)}h`;
}

export function toDateTimeInputValue(dateLike: Date) {
	const year = dateLike.getFullYear();
	const month = String(dateLike.getMonth() + 1).padStart(2, "0");
	const day = String(dateLike.getDate()).padStart(2, "0");
	const hours = String(dateLike.getHours()).padStart(2, "0");
	const minutes = String(dateLike.getMinutes()).padStart(2, "0");
	return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function keepOnlyDigits(value: string) {
	return value.replace(/\D+/g, "");
}

export function toDateTimeInputValueFromIso(dateLike: string) {
	const date = new Date(dateLike);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatDateTime(isoDate: string) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(isoDate));
}

export function minutesFromSeconds(seconds: number) {
	return Math.max(1, Math.round(seconds / 60));
}

/**
 * Convert a datetime-local input value (e.g., "2026-07-03T20:56")
 * to a proper ISO string with timezone information.
 * This ensures the local time is preserved when sent to the server.
 */
export function datetimeLocalToIso(datetimeLocal: string): string {
	// datetime-local format: "YYYY-MM-DDTHH:mm"
	// We need to parse it as a local date, not UTC
	const [datePart, timePart] = datetimeLocal.split("T");
	const [year, month, day] = datePart.split("-").map(Number);
	const [hours, minutes] = timePart.split(":").map(Number);

	// Create a Date object in local timezone
	const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

	// Convert to ISO string (this will include timezone offset)
	return date.toISOString();
}

export function focusModalAutofocus() {
	if (typeof document === "undefined") return;
	const target = document.querySelector<HTMLElement>("[data-autofocus]");
	if (!target || target.hasAttribute("disabled")) return;
	target.focus();
	if (
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement
	) {
		target.select();
	}
}
