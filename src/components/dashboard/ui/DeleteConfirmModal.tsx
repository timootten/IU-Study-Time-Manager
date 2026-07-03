import { useTranslation } from "react-i18next";
import DashboardModal from "#/components/dashboard/ui/DashboardModal";

type DeleteConfirmModalProps = {
	title: string;
	description: string;
	isPending: boolean;
	onClose: () => void;
	onConfirm: () => void;
};

export default function DeleteConfirmModal({
	title,
	description,
	isPending,
	onClose,
	onConfirm,
}: DeleteConfirmModalProps) {
	const { t } = useTranslation();
	return (
		<DashboardModal
			open
			title={title}
			description={description}
			onClose={onClose}
			footer={
				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-(--line) bg-(--surface-strong) px-4 py-2 text-xs font-semibold text-(--sea-ink) hover:bg-(--link-bg-hover)"
					>
						{t("common.cancel")}
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={isPending}
						className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
					>
						{isPending ? t("common.deleting") : t("common.delete")}
					</button>
				</div>
			}
		>
			<p className="text-sm text-(--sea-ink-soft)">
				{t("modal.deleteWarning")}
			</p>
		</DashboardModal>
	);
}
