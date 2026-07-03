import { MoonStar, Settings2, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n, { SUPPORTED_LANGUAGES, type SupportedLanguage } from "#/lib/i18n";
import { replaceLangInPath } from "#/lib/i18n/paths";
import {
	applyThemeMode,
	getInitialThemeMode,
	type ThemeMode,
} from "#/lib/theme";

const LANGUAGE_META: Record<
	SupportedLanguage,
	{ label: string; flag: string }
> = {
	en: { label: "English", flag: "🇬🇧" },
	de: { label: "Deutsch", flag: "🇩🇪" },
};

export default function QuickSettingsButton() {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState<ThemeMode>(getInitialThemeMode);
	const [lang, setLang] = useState<SupportedLanguage>(
		() => (i18n.language as SupportedLanguage) ?? "en",
	);
	const rootRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const handler = (lng: string) => {
			setLang(lng as SupportedLanguage);
		};
		i18n.on("languageChanged", handler);
		return () => i18n.off("languageChanged", handler);
	}, []);

	useEffect(() => {
		if (!open) return;
		function onPointerDown(e: MouseEvent) {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
		}
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("mousedown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open]);

	function handleTheme(next: ThemeMode) {
		setMode(next);
		applyThemeMode(next);
	}

	function handleLanguage(next: SupportedLanguage) {
		setLang(next);
		i18n.changeLanguage(next);
		// URL is the single source of truth for language.
		const nextPath = replaceLangInPath(window.location.pathname, next);
		window.history.replaceState(null, "", nextPath);
	}

	return (
		<div className="relative" ref={rootRef}>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-label={t("nav.settings")}
				aria-expanded={open}
				title={t("nav.settings")}
				className="inline-flex cursor-pointer h-10 w-10 items-center justify-center rounded-full border border-(--chip-line) bg-(--chip-bg) text-(--sea-ink) shadow-[0_8px_22px_rgba(24,61,68,0.12)] transition hover:-translate-y-0.5"
			>
				<Settings2 size={18} aria-hidden="true" />
			</button>

			{open ? (
				<div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-(--line) bg-(--surface-strong) p-4 shadow-[0_12px_28px_rgba(16,47,55,0.16)]">
					<p className="mb-3 text-sm font-semibold text-(--sea-ink-soft)">
						{t("settings.quickTitle")}
					</p>

					<div>
						<p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-(--sea-ink-soft)">
							{t("settings.appearance")}
						</p>
						<div className="grid grid-cols-2 gap-2">
							{(["dark", "light"] as const).map((m) => (
								<button
									key={m}
									type="button"
									onClick={() => handleTheme(m)}
									className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
										mode === m
											? "border-(--brand) bg-(--brand-wash) text-(--sea-ink)"
											: "border-(--chip-line) bg-(--chip-bg) text-(--sea-ink-soft)"
									}`}
								>
									{m === "dark" ? (
										<MoonStar size={14} aria-hidden="true" />
									) : (
										<Sun size={14} aria-hidden="true" />
									)}
									{t(`settings.${m}`)}
								</button>
							))}
						</div>
					</div>

					<div className="mt-4">
						<p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-(--sea-ink-soft)">
							{t("settings.language")}
						</p>
						<div className="grid grid-cols-2 gap-2">
							{SUPPORTED_LANGUAGES.map((l) => (
								<button
									key={l}
									type="button"
									onClick={() => void handleLanguage(l)}
									className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
										lang === l
											? "border-(--brand) bg-(--brand-wash) text-(--sea-ink)"
											: "border-(--chip-line) bg-(--chip-bg) text-(--sea-ink-soft)"
									}`}
								>
									<span aria-hidden="true">{LANGUAGE_META[l].flag}</span>
									{t(`settings.language${l === "en" ? "En" : "De"}`)}
								</button>
							))}
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
