import { Plus, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

type AchievementEmptyStateProps = {
	isEmptyAll: boolean;
	onCreate: () => void;
};

export default function AchievementEmptyState({
	isEmptyAll,
	onCreate,
}: AchievementEmptyStateProps) {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--line) px-6 py-16 text-center">
			<Trophy size={36} className="mb-3 text-(--sea-ink-soft)/50" />
			<p className="text-sm font-semibold text-(--sea-ink)">
				{isEmptyAll
					? t("achievements.emptyState.title")
					: t("achievements.noMatching.title")}
			</p>
			<p className="mt-1 text-xs text-(--sea-ink-soft)">
				{isEmptyAll
					? t("achievements.emptyState.description")
					: t("achievements.noMatching.description")}
			</p>
			{isEmptyAll && (
				<button
					type="button"
					onClick={onCreate}
					className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-(--brand) px-4 py-2 text-xs font-bold text-white hover:opacity-90"
				>
					<Plus size={14} />
					{t("achievements.emptyState.addButton")}
				</button>
			)}
		</div>
	);
}
