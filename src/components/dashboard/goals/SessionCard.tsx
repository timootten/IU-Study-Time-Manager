import { Edit2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDuration } from "#/components/dashboard/goals/format-utils";
import type { StudySessionView } from "#/lib/server/study-manager";

type SessionCardProps = {
	session: StudySessionView;
	onEdit: () => void;
	onDelete: () => void;
};

export default function SessionCard({
	session,
	onEdit,
	onDelete,
}: SessionCardProps) {
	const { i18n, t } = useTranslation();
	function formatDateTimeLocale(iso: string) {
		return new Date(iso).toLocaleString(i18n.language, {
			day: "2-digit",
			month: "long",
			hour: "2-digit",
			minute: "2-digit",
		});
	}
	const statusColor =
		session.status === "completed"
			? "text-emerald-600 dark:text-emerald-400"
			: session.status === "active"
				? "text-blue-600 dark:text-blue-400"
				: "text-(--sea-ink-soft)";

	return (
		<div className="flex items-center justify-between rounded-xl border border-(--line) bg-(--surface) px-3 py-2.5">
			<div className="flex-1 min-w-0">
				<div className="flex flex-wrap items-center gap-2 text-xs text-(--sea-ink)">
					<span className="font-semibold">
						{formatDateTimeLocale(session.startIso)}
					</span>
					{session.endIso && (
						<>
							<span className="text-(--sea-ink-soft)">→</span>
							<span className="font-semibold">
								{formatDateTimeLocale(session.endIso)}
							</span>
						</>
					)}
					<span
						className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${session.category === "course" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : session.category === "learning" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-gray-500/10 text-gray-600 dark:text-gray-400"}`}
					>
						{t(`dashboard.${session.category}`)}
					</span>
					{!session.countsTowardGoal && (
						<span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-gray-500/10 text-gray-600 dark:text-gray-400">
							{t("goals.notCounted")}
						</span>
					)}
				</div>
				<div className="mt-0.5 flex items-center gap-2 text-[11px]">
					<span className={`font-semibold ${statusColor}`}>
						{t(`goals.status.${session.status}`).charAt(0).toUpperCase() +
							t(`goals.status.${session.status}`).slice(1)}
					</span>
					{session.durationSec != null && (
						<span className="text-(--sea-ink-soft)">
							· {formatDuration(session.durationSec)}
						</span>
					)}
				</div>
			</div>
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={onEdit}
					className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--sea-ink-soft) hover:bg-(--link-bg-hover) hover:text-(--sea-ink)"
				>
					<Edit2 size={13} />
				</button>
				<button
					type="button"
					onClick={onDelete}
					className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--sea-ink-soft) hover:bg-rose-500/10 hover:text-rose-600"
				>
					<Trash2 size={13} />
				</button>
			</div>
		</div>
	);
}
