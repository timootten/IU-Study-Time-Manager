import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLangParam } from "#/lib/i18n/paths";

const STORAGE_KEY = "stm_cookie_notice_ack";

/**
 * Simple informational cookie notice banner.
 * Only informs users about strictly necessary cookies/localStorage – no consent required.
 * Dismissal state is persisted in localStorage so the banner won't reappear.
 */
export default function CookieNotice() {
	const { t } = useTranslation();
	const lang = useLangParam();
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const ack = localStorage.getItem(STORAGE_KEY);
		if (!ack) {
			setVisible(true);
		}
	}, []);

	const dismiss = () => {
		localStorage.setItem(STORAGE_KEY, "1");
		setVisible(false);
	};

	if (!visible) return null;

	return (
		<div className="fixed bottom-4 right-4 z-50 w-[min(calc(100vw-2rem),420px)] rounded-2xl border border-(--line) bg-(--surface-strong) p-5 shadow-xl sm:bottom-6 sm:right-6">
			<h2 className="m-0 text-base font-semibold text-(--sea-ink)">
				{t("cookieNotice.title")}
			</h2>
			<p className="mt-2 text-sm leading-relaxed text-(--sea-ink-soft)">
				{t("cookieNotice.message")}{" "}
				<Link
					to="/$lang/legal/privacy"
					params={{ lang }}
					className="underline hover:text-(--brand)"
				>
					{t("cookieNotice.privacyLink")}
				</Link>
			</p>
			<button
				type="button"
				onClick={dismiss}
				className="mt-4 w-full rounded-lg bg-(--brand) px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-(--brand-strong)"
			>
				{t("cookieNotice.accept")}
			</button>
		</div>
	);
}
