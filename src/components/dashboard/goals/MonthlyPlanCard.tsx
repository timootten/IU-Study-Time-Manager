import { Edit2, Trash2 } from "lucide-react";
import type { StudyRoughPlanView } from "#/lib/server/study-manager";

type MonthlyPlanCardProps = {
	plan: StudyRoughPlanView;
	onEdit: () => void;
	onDelete: () => void;
};

export default function MonthlyPlanCard({
	plan,
	onEdit,
	onDelete,
}: MonthlyPlanCardProps) {
	const monthLabel = (() => {
		const [year, month] = plan.month.split("-");
		return new Date(Number(year), Number(month) - 1).toLocaleDateString(
			"en-US",
			{ month: "long", year: "numeric" },
		);
	})();

	return (
		<div className="flex items-center justify-between rounded-xl border border-(--line) bg-(--surface) px-3 py-2.5">
			<div className="flex-1 min-w-0">
				<p className="text-xs font-semibold text-(--sea-ink)">{monthLabel}</p>
				<p className="text-[11px] text-(--sea-ink-soft)">
					{plan.plannedHours}h planned
				</p>
				{plan.notes && (
					<p className="mt-0.5 whitespace-pre-line text-[11px] leading-snug text-(--sea-ink-soft)">
						{plan.notes}
					</p>
				)}
			</div>
			<div className="flex items-center gap-1 ml-2">
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
