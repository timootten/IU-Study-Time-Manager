import { Edit2, UploadCloud } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { IcsImportDraft } from "#/components/dashboard/calendar/calendar-utils";
import DashboardModal from "#/components/dashboard/ui/DashboardModal";
import FieldError from "#/components/dashboard/ui/FieldError";
import { randomBrightColor } from "#/components/dashboard/utils/color-utils";
import type { StudyCalendarImportView } from "#/lib/server/study-manager";

type CalendarImportModalProps = {
	imports: StudyCalendarImportView[];
	importCounts: Map<string, number>;
	importDraft: IcsImportDraft | null;
	importPending: boolean;
	onDraftChange: (draft: IcsImportDraft | null) => void;
	onImport: () => void;
	onToggleVisibility: (
		entry: StudyCalendarImportView,
		visible: boolean,
	) => void;
	onEdit: (entry: StudyCalendarImportView) => void;
	onRemove: (entry: StudyCalendarImportView) => void;
	onClose: () => void;
};

export default function CalendarImportModal({
	imports,
	importCounts,
	importDraft,
	importPending,
	onDraftChange,
	onImport,
	onToggleVisibility,
	onEdit,
	onRemove,
	onClose,
}: CalendarImportModalProps) {
	const { t } = useTranslation();
	async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			const text = await file.text();
			onDraftChange({
				id: `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`,
				fileName: file.name,
				name: "",
				color: randomBrightColor(),
				icsText: text,
			});
		} finally {
			e.target.value = "";
		}
	}

	const [showValidation, setShowValidation] = useState(false);

	const importDraftError = !importDraft ? t("calendar.selectFile") : null;

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setShowValidation(true);
		if (!importDraft || importPending) return;
		onImport();
	}

	return (
		<DashboardModal
			open
			title={t("modal.icsImports")}
			description={t("modal.icsImportsDescription")}
			onClose={onClose}
			footer={
				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-(--line) bg-(--surface-strong) px-4 py-2 text-xs font-semibold text-(--sea-ink) hover:bg-(--link-bg-hover)"
					>
						{t("common.close")}
					</button>
				</div>
			}
		>
			<div className="space-y-5">
				<section className="space-y-3">
					<div className="flex items-center justify-between">
						<h4 className="text-sm font-bold text-(--sea-ink)">
							{t("calendar.importedCalendars")}
						</h4>
						<span className="text-xs text-(--sea-ink-soft)">
							{imports.length} {t("calendar.total")}
						</span>
					</div>
					{imports.length === 0 ? (
						<p className="rounded-xl border border-dashed border-(--line) px-4 py-4 text-center text-xs text-(--sea-ink-soft)">
							{t("calendar.noImportsYet")}
						</p>
					) : (
						<div className="space-y-2">
							{imports.map((entry) => (
								<div
									key={entry.id}
									className="flex items-center justify-between rounded-xl border border-(--line) bg-(--surface) px-4 py-3"
								>
									<div className="flex items-center gap-3">
										<label className="flex items-center gap-2">
											<input
												type="checkbox"
												checked={entry.visible ?? true}
												onChange={(e) =>
													onToggleVisibility(entry, e.target.checked)
												}
												className="h-4 w-4 rounded border-(--line) text-(--brand)"
											/>
										</label>
										<button
											type="button"
											onClick={() => onEdit(entry)}
											className="h-3 w-3 rounded-full border border-(--line) cursor-pointer"
											style={{ backgroundColor: entry.color }}
											aria-label={t("common.editName", { name: entry.name })}
										/>
										<div>
											<p className="text-sm font-semibold text-(--sea-ink)">
												{entry.name}
											</p>
											<p className="text-xs text-(--sea-ink-soft)">
												{importCounts.get(entry.id) ?? 0}{" "}
												{t("calendar.sessions")}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={() => onEdit(entry)}
											className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--sea-ink-soft) hover:bg-(--link-bg-hover) hover:text-(--sea-ink)"
										>
											<Edit2 size={13} />
										</button>
										<button
											type="button"
											onClick={() => onRemove(entry)}
											className="rounded-lg border border-(--line) bg-(--surface-strong) px-3 py-1.5 text-xs font-semibold text-(--sea-ink-soft) hover:bg-rose-500/10 hover:text-rose-600"
										>
											{t("common.remove")}
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</section>

				<form className="space-y-3" onSubmit={handleSubmit}>
					<div className="flex items-center justify-between">
						<h4 className="text-sm font-bold text-(--sea-ink)">
							{t("calendar.addNewImport")}
						</h4>
						<span className="text-xs text-(--sea-ink-soft)">
							{t("calendar.singleIcsFile")}
						</span>
					</div>
					<div className="rounded-xl border border-dashed border-(--line) bg-(--surface) px-4 py-4">
						<div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="text-sm font-semibold text-(--sea-ink)">
									{t("calendar.dropIcs")}
								</p>
								<p className="text-xs text-(--sea-ink-soft)">
									{t("calendar.selectOneIcs")}
								</p>
							</div>
							<label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-(--line) bg-(--surface-strong) px-3 py-2 text-xs font-semibold text-(--sea-ink-soft) hover:bg-(--link-bg-hover)">
								<input
									type="file"
									accept=".ics,text/calendar"
									onChange={handleFileChange}
									className="sr-only"
								/>
								<span className="text-(--sea-ink-soft)">
									{t("calendar.chooseFile")}
								</span>
							</label>
						</div>
					</div>

					{showValidation && importDraftError && (
						<div className="mt-2">
							<FieldError message={importDraftError} />
						</div>
					)}

					{importDraft && (
						<div className="mt-3 rounded-xl border border-(--line) bg-(--surface-strong) px-4 py-3">
							<div className="flex items-center justify-between">
								<p className="text-sm font-semibold text-(--sea-ink)">
									{t("calendar.selectedIcs")}
								</p>
								<button
									type="button"
									onClick={() => onDraftChange(null)}
									className="rounded-lg border px-3 py-1 text-xs"
								>
									{t("common.remove")}
								</button>
							</div>
							<div className="mt-3">
								<label
									htmlFor="calendar-import-name"
									className="mb-1 block text-xs font-semibold text-(--sea-ink)"
								>
									{t("common.name")}
								</label>
								<input
									id="calendar-import-name"
									data-autofocus
									type="text"
									value={importDraft.name}
									onChange={(e) =>
										onDraftChange({ ...importDraft, name: e.target.value })
									}
									maxLength={120}
									className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm"
								/>
							</div>
							<div className="mt-3">
								<label
									htmlFor="calendar-import-color"
									className="mb-1 block text-xs font-semibold text-(--sea-ink)"
								>
									{t("common.color")}
								</label>
								<div className="flex items-center gap-3">
									<label
										className="h-8 w-8 cursor-pointer rounded-full border border-(--line)"
										style={{ backgroundColor: importDraft.color }}
									>
										<input
											id="calendar-import-color"
											type="color"
											value={importDraft.color}
											onChange={(e) =>
												onDraftChange({ ...importDraft, color: e.target.value })
											}
											className="sr-only"
										/>
									</label>
									<button
										type="button"
										onClick={() =>
											onDraftChange({
												...importDraft,
												color: randomBrightColor(),
											})
										}
										className="rounded-lg border border-(--line) bg-(--surface) px-3 py-2 text-xs font-semibold text-(--sea-ink-soft) hover:bg-(--link-bg-hover)"
									>
										{t("common.random")}
									</button>
								</div>
							</div>
							<div className="mt-3">
								<label className="flex items-center gap-2 text-xs font-semibold text-(--sea-ink) cursor-pointer">
									<input
										type="checkbox"
										checked={importDraft.visible ?? true}
										onChange={(e) =>
											onDraftChange({
												...importDraft,
												visible: e.target.checked,
											})
										}
										className="h-4 w-4 rounded border-(--line) text-(--brand) focus:ring-2 focus:ring-(--brand)/40"
									/>
									<span>{t("calendar.visibleOnCalendar")}</span>
								</label>
							</div>
							<div className="mt-4 flex justify-end gap-2">
								<button
									type="button"
									onClick={() => onDraftChange(null)}
									className="rounded-lg border border-(--line) px-4 py-2 text-xs font-semibold"
								>
									{t("common.cancel")}
								</button>
								<button
									type="submit"
									disabled={importPending}
									className="rounded-lg bg-(--brand) px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
								>
									<UploadCloud size={14} className="inline-block mr-2" />
									{importPending
										? t("calendar.importing")
										: t("calendar.import")}
								</button>
							</div>
						</div>
					)}
				</form>
			</div>
		</DashboardModal>
	);
}
