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
