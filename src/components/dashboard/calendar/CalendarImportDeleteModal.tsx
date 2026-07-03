import { useTranslation } from "react-i18next";
import DashboardModal from "#/components/dashboard/ui/DashboardModal";

type CalendarImportDeleteModalProps = {
	onCancel: () => void;
	onConfirm: () => void;
};

export default function CalendarImportDeleteModal({
	onCancel,
	onConfirm,
}: CalendarImportDeleteModalProps) {
	const { t } = useTranslation();
	return (
		<DashboardModal
			open
			title={t("modal.removeImport")}
			description={t("modal.removeImportDescription")}
			onClose={onCancel}
			footer={
				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={onCancel}
						className="rounded-lg border border-(--line) bg-(--surface-strong) px-4 py-2 text-xs font-semibold text-(--sea-ink) hover:bg-(--link-bg-hover)"
					>
						{t("common.cancel")}
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:opacity-90"
					>
						{t("common.remove")}
					</button>
				</div>
			}
		>
			<div>
				<p className="text-sm">{t("modal.removeImport")}</p>
				<p className="text-xs text-(--sea-ink-soft) mt-2">
					{t("modal.removeImportDescription")}
				</p>
			</div>
		</DashboardModal>
	);
}
