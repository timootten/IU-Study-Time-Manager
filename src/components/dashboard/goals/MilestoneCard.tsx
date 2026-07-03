import { Check, Edit2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDate } from "#/components/dashboard/goals/format-utils";
import type { StudyMilestoneView } from "#/lib/server/study-manager";

type MilestoneCardProps = {
	milestone: StudyMilestoneView;
	onToggle: () => void;
	onEdit: () => void;
	onDelete: () => void;
};

export default function MilestoneCard({
	milestone,
	onToggle,
	onEdit,
	onDelete,
}: MilestoneCardProps) {
	const { i18n } = useTranslation();
	return (
		<div className="flex items-center gap-3 rounded-xl border border-(--line) bg-(--surface) px-3 py-2.5">
			<button
				type="button"
				onClick={onToggle}
				className={`shrink-0 flex h-5 w-5 items-center justify-center rounded-md border transition ${milestone.isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : "border-(--line) bg-(--surface-strong) text-transparent hover:border-(--brand)"}`}
			>
				<Check size={12} />
			</button>
			<div className="flex-1 min-w-0">
				<p
					className={`text-xs font-semibold ${milestone.isCompleted ? "line-through text-(--sea-ink-soft)" : "text-(--sea-ink)"}`}
				>
					{milestone.title}
				</p>
				<p
					className={`text-[11px] ${milestone.isOverdue && !milestone.isCompleted ? "font-semibold text-rose-600 dark:text-rose-400" : "text-(--sea-ink-soft)"}`}
				>
					Due {formatDate(milestone.dueDateIso, i18n.language)}
					{milestone.isCompleted &&
						milestone.completedAtIso &&
						` · Completed ${formatDate(milestone.completedAtIso, i18n.language)}`}
					{milestone.isOverdue && !milestone.isCompleted && " · Overdue"}
				</p>
			</div>
			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={onEdit}
					className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--sea-ink-soft) hover:bg-(--link-bg-hover) hover:text-(--brand)"
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
