import { useTranslation } from "react-i18next";
import DashboardModal from "#/components/dashboard/ui/DashboardModal";
import { randomBrightColor } from "#/components/dashboard/utils/color-utils";
import type { StudyCalendarImportView } from "#/lib/server/study-manager";

type CalendarImportEditModalProps = {
	entry: StudyCalendarImportView;
	onChange: (entry: StudyCalendarImportView) => void;
	onSave: () => void;
	onClose: () => void;
};

export default function CalendarImportEditModal({
	entry,
	onChange,
	onSave,
	onClose,
}: CalendarImportEditModalProps) {
	const { t } = useTranslation();

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		onSave();
	}

	return (
		<DashboardModal
			open
			title={t("modal.editImport")}
			description={t("modal.editImportDescription")}
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
						onClick={onSave}
						className="rounded-lg bg-(--brand) px-4 py-2 text-xs font-bold text-white hover:opacity-90"
					>
						{t("common.save")}
					</button>
				</div>
			}
		>
			<form className="space-y-4" onSubmit={handleSubmit}>
				<div>
					<label
						htmlFor="calendar-edit-import-name"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("calendar.importEdit.nameLabel")}
					</label>
					<input
						id="calendar-edit-import-name"
						value={entry.name}
						onChange={(e) => onChange({ ...entry, name: e.target.value })}
						className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm"
						maxLength={120}
					/>
				</div>
				<div>
					<label
						htmlFor="calendar-edit-import-color"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("calendar.importEdit.colorLabel")}
					</label>
					<div className="flex items-center gap-3">
						<label
							className="h-8 w-8 cursor-pointer rounded-full border border-(--line)"
							style={{ backgroundColor: entry.color }}
						>
							<input
								id="calendar-edit-import-color"
								type="color"
								value={entry.color}
								onChange={(e) => onChange({ ...entry, color: e.target.value })}
								className="sr-only"
							/>
						</label>
						<button
							type="button"
							onClick={() => onChange({ ...entry, color: randomBrightColor() })}
							className="rounded-lg border border-(--line) bg-(--surface) px-3 py-2 text-xs font-semibold text-(--sea-ink-soft) hover:bg-(--link-bg-hover)"
						>
							{t("calendar.importEdit.randomColor")}
						</button>
					</div>
				</div>
				<div>
					<label className="flex items-center gap-2 text-xs font-semibold text-(--sea-ink) cursor-pointer">
						<input
							type="checkbox"
							checked={entry.visible ?? true}
							onChange={(e) =>
								onChange({ ...entry, visible: e.target.checked })
							}
							className="h-4 w-4 rounded border-(--line) text-(--brand) focus:ring-2 focus:ring-(--brand)/40"
						/>
						<span>{t("calendar.visibleOnCalendar")}</span>
					</label>
				</div>
			</form>
		</DashboardModal>
	);
}
