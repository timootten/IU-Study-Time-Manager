import type { SessionCategory } from "#/lib/server/study-manager";

export const SESSION_CATEGORY_LABELS: Record<SessionCategory, string> = {
	course: "Course",
	learning: "Learning",
	other: "Other",
};

export const GOAL_STATUSES = [
	"active",
	"completed",
	"failed",
	"paused",
] as const;

export function formatDate(iso: string, lang: string = "en") {
	const localeMap: Record<string, string> = {
		en: "en-US",
		de: "de-DE",
	};
	const locale = localeMap[lang] || "en-US";
	return new Date(iso).toLocaleDateString(locale, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function formatDateTime(iso: string, lang: string = "en") {
	const localeMap: Record<string, string> = {
		en: "en-US",
		de: "de-DE",
	};
	const locale = localeMap[lang] || "en-US";
	return new Date(iso).toLocaleDateString(locale, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function toDatetimeLocal(iso: string) {
	const d = new Date(iso);
	const pad = (n: number) => n.toString().padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDuration(sec: number) {
	const h = Math.floor(sec / 3600);
	const m = Math.floor((sec % 3600) / 60);
	if (h === 0) return `${m}min`;
	return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
