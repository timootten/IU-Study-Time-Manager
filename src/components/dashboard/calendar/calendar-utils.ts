import { FileText, GraduationCap, Presentation, Target } from "lucide-react";
import { toRgba } from "#/components/dashboard/utils/color-utils";
import type {
	GoalCategory,
	SessionCategory,
	SessionStatus,
} from "#/lib/server/study-manager";

export function monthNames(locale?: string) {
	const names: string[] = [];
	for (let i = 0; i < 12; i++) {
		names.push(
			new Date(2000, i, 1).toLocaleString(locale || undefined, {
				month: "long",
			}),
		);
	}
	return names;
}

export function dayLabels(locale?: string) {
	// Produce short weekday labels starting from Monday
	const labels: string[] = [];
	// Use a known Monday as base
	const base = new Date(Date.UTC(2021, 10, 1)); // 2021-11-01 is Monday
	for (let i = 0; i < 7; i++) {
		const d = new Date(base);
		d.setUTCDate(base.getUTCDate() + i);
		labels.push(
			d.toLocaleDateString(locale || undefined, { weekday: "short" }),
		);
	}
	return labels;
}

export interface CalendarSession {
	id: string;
	goalId: string | null;
	goalTitle: string;
	name: string | null;
	color: string;
	startIso: string;
	endIso: string | null;
	status: SessionStatus;
	durationSec: number | null;
	category: SessionCategory;
	countsTowardGoal: boolean;
	notificationsEnabled: boolean;
	notes: string | null;
	importId?: string | null;
	source?: "manual" | "ics";
}

export interface SpanSegment {
	session: CalendarSession;
	lane: number;
	isRowStart: boolean;
	isRowEnd: boolean;
	endsInRow: boolean;
	colSpan: number;
}

export type IcsImportDraft = {
	id: string;
	fileName: string;
	name: string;
	color: string;
	icsText: string;
	visible?: boolean;
	notificationsEnabled?: boolean;
};

export function isSameDay(a: Date, b: Date) {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

export function formatTime(iso: string) {
	return new Date(iso).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatDateShort(iso: string) {
	return new Date(iso).toLocaleDateString([], {
		month: "short",
		day: "numeric",
	});
}

export function formatDuration(sec: number) {
	const h = Math.floor(sec / 3600);
	const m = Math.floor((sec % 3600) / 60);
	if (h > 0 && m > 0) return `${h}h ${m}m`;
	if (h > 0) return `${h}h`;
	return `${m}m`;
}

export function plannedDurationMin(start: string, end: string) {
	const ms = new Date(end).getTime() - new Date(start).getTime();
	const totalMin = Math.round(ms / 60_000);
	const h = Math.floor(totalMin / 60);
	const m = totalMin % 60;
	if (h > 0 && m > 0) return `${h}h ${m}m`;
	if (h > 0) return `${h}h`;
	return `${m}m`;
}

export function getCalendarGrid(year: number, month: number) {
	const firstOfMonth = new Date(year, month, 1);
	const startDow = (firstOfMonth.getDay() + 6) % 7;
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const cells: (number | null)[] = [];
	for (let i = 0; i < startDow; i++) cells.push(null);
	for (let d = 1; d <= daysInMonth; d++) cells.push(d);
	while (cells.length % 7 !== 0) cells.push(null);
	return cells;
}

export function getCategoryAlpha(category: SessionCategory) {
	if (category === "course") return 0.1;
	if (category === "learning") return 0.22;
	return 0.16;
}

export function getSessionStyle(session: CalendarSession) {
	const alpha = getCategoryAlpha(session.category);
	return {
		bg: toRgba(session.color, alpha),
		border: toRgba(session.color, Math.min(alpha + 0.14, 0.45)),
		text: session.color,
		dot: session.color,
	};
}

export function getGoalIcon(category: GoalCategory) {
	if (category === "exam") return GraduationCap;
	if (category === "project") return FileText;
	if (category === "presentation") return Presentation;
	return Target;
}
