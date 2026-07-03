import { useTranslation } from "react-i18next";
import DashboardModal from "#/components/dashboard/ui/DashboardModal";

type AdminUserDeleteModalProps = {
	user: { id: string; name: string };
	isPending: boolean;
	onCancel: () => void;
	onConfirm: (userId: string) => void;
};

export default function AdminUserDeleteModal({
	user,
	isPending,
	onCancel,
	onConfirm,
}: AdminUserDeleteModalProps) {
	const { t } = useTranslation();
	return (
		<DashboardModal
			open
			title={t("admin.deleteUserTitle")}
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
						onClick={() => onConfirm(user.id)}
						disabled={isPending}
						className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
					>
						{isPending ? t("common.deleting") : t("common.delete")}
					</button>
				</div>
			}
		>
			<p className="text-sm text-(--sea-ink-soft)">
				{t("admin.deleteUserDescription", { name: user.name })}
			</p>
			<p className="mt-3 text-sm text-(--sea-ink-soft)">
				{t("modal.deleteWarning")}
			</p>
		</DashboardModal>
	);
}
