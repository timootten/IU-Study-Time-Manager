import { useTranslation } from "react-i18next";
import DashboardModal from "#/components/dashboard/ui/DashboardModal";
import type { StudyAchievementView } from "#/lib/server/study-manager";

type AchievementDeleteModalProps = {
	achievement: StudyAchievementView;
	isPending: boolean;
	onCancel: () => void;
	onConfirm: (achievement: StudyAchievementView) => void;
};

export default function AchievementDeleteModal({
	achievement,
	isPending,
	onCancel,
	onConfirm,
}: AchievementDeleteModalProps) {
	const { t } = useTranslation();
	return (
		<DashboardModal
			open
			title={t("modal.deleteAchievement")}
			description={`${t("achievements.delete.descriptionPart1")}${achievement.name ? ` "${achievement.name}"` : ""}${achievement.goalTitle ? t("achievements.delete.descriptionFor", { goalTitle: achievement.goalTitle }) : ""}?`}
			onClose={onCancel}
			footer={
				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={onCancel}
						className="rounded-lg border border-(--line) bg-(--surface-strong) px-4 py-2 text-xs font-semibold text-(--sea-ink) hover:bg-(--link-bg-hover)"
					>
						{t("achievements.delete.cancelBtn")}
					</button>
					<button
						type="button"
						onClick={() => onConfirm(achievement)}
						disabled={isPending}
						className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
					>
						{isPending
							? t("common.deleting")
							: t("achievements.delete.deleteBtn")}
					</button>
				</div>
			}
		>
			<div />
		</DashboardModal>
	);
}
