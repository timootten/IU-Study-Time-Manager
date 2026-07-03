import {
	createFileRoute,
	Link,
	redirect,
	useSearch,
} from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { createServiceRouteErrorComponent } from "#/components/errors/RouteServiceError";
import { authClient } from "#/lib/auth-client";
import { getAuthErrorMessage } from "#/lib/errors/extract-error";
import i18n, { type SupportedLanguage } from "#/lib/i18n";
import { useLangParam, withLang } from "#/lib/i18n/paths";
import { seoHead } from "#/lib/i18n/seo";
import { getAuthSession } from "#/lib/server/auth-session";
import { requireServiceAvailability } from "#/lib/server/require-service-availability";

const resetPasswordErrorComponent = createServiceRouteErrorComponent({
	unavailableTitleKey: "errors.resetUnavailableTitle",
	fallbackTitleKey: "errors.resetLoadFailedTitle",
	fallbackDescriptionKey: "errors.resetLoadFailedDescription",
});

export const Route = createFileRoute("/$lang/auth/password-reset")({
	validateSearch: (search: Record<string, unknown>) => ({
		token: (search.token as string) ?? "",
	}),
	loader: async ({ params }) => {
		const lang = params.lang as SupportedLanguage;
		const t = i18n.getFixedT(lang);
		await requireServiceAvailability(t("errors.authServiceUnavailable"));

		const session = await getAuthSession();
		if (session?.user) {
			throw redirect({ to: withLang(lang, "/dashboard") });
		}

		return null;
	},
	head: ({ params }) =>
		seoHead(
			"resetPasswordTitle",
			"resetPasswordDescription",
			params.lang as SupportedLanguage,
			"/auth/password-reset",
		),
	errorComponent: resetPasswordErrorComponent,
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const { t } = useTranslation();
	const lang = useLangParam();
	const { token } = useSearch({ from: "/$lang/auth/password-reset" });
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	if (!token) {
		return (
			<section className="page-wrap py-8 sm:py-14">
				<div className="mx-auto w-full max-w-md rounded-3xl border border-(--line) bg-(--surface-strong) p-6 shadow-[0_22px_48px_rgba(16,47,55,0.14)] sm:p-8">
					<p className="island-kicker m-0">{t("auth.kicker")}</p>
					<h1 className="display-title mt-2 text-3xl sm:text-4xl">
						{t("auth.resetInvalidLink")}
					</h1>
					<p className="mt-4 text-sm text-(--sea-ink-soft)">
						{t("auth.resetInvalidLinkDescription")}
					</p>
					<div className="mt-6 flex gap-3">
						<Link
							to={withLang(lang, "/auth/forgot-password")}
							className="btn-brand inline-flex h-11 items-center rounded-xl px-4 text-sm font-semibold no-underline"
						>
							{t("auth.resetRequestNewLink")}
						</Link>
						<Link
							to={withLang(lang, "/auth/login")}
							className="inline-flex h-11 items-center rounded-xl border border-(--line) bg-(--surface-strong) px-4 text-sm font-semibold text-(--sea-ink) no-underline hover:bg-(--link-bg-hover)"
						>
							{t("auth.signIn")}
						</Link>
					</div>
				</div>
			</section>
		);
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

		if (password !== confirmPassword) {
			setError(t("auth.passwordMismatch"));
			return;
		}

		if (password.length < 8) {
			setError(t("auth.passwordTooShort"));
			return;
		}

		setLoading(true);

		try {
			const { error: apiError } = await authClient.resetPassword({
				newPassword: password,
				token,
			});

			if (apiError) {
				setError(getAuthErrorMessage(apiError));
				return;
			}

			setSuccess(true);
			toast.success(t("auth.passwordResetSuccess"));
		} catch (cause) {
			setError(getAuthErrorMessage(cause));
		} finally {
			setLoading(false);
		}
	};

	if (success) {
		return (
			<section className="page-wrap py-8 sm:py-14">
				<div className="mx-auto w-full max-w-md rounded-3xl border border-(--line) bg-(--surface-strong) p-6 shadow-[0_22px_48px_rgba(16,47,55,0.14)] sm:p-8">
					<p className="island-kicker m-0">{t("auth.kicker")}</p>
					<h1 className="display-title mt-2 text-3xl sm:text-4xl">
						{t("auth.resetPasswordUpdated")}
					</h1>
					<div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
						<p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
							{t("auth.resetPasswordUpdatedDescription")}
						</p>
						<p className="mt-1.5 text-sm text-emerald-700 dark:text-emerald-300">
							{t("auth.resetPasswordUpdatedSub")}
						</p>
					</div>
					<Link
						to={withLang(lang, "/auth/login")}
						className="btn-brand mt-6 inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold no-underline"
					>
						{t("auth.signIn")}
					</Link>
				</div>
			</section>
		);
	}

	return (
		<section className="page-wrap py-8 sm:py-14">
			<div className="mx-auto w-full max-w-md rounded-3xl border border-(--line) bg-(--surface-strong) p-6 shadow-[0_22px_48px_rgba(16,47,55,0.14)] sm:p-8">
				<p className="island-kicker m-0">{t("auth.kicker")}</p>
				<h1 className="display-title mt-2 text-3xl sm:text-4xl">
					{t("auth.resetSetNewPassword")}
				</h1>
				<p className="mt-2 text-sm text-(--sea-ink-soft)">
					{t("auth.resetNewPasswordSubtitle")}
				</p>

				<form onSubmit={handleSubmit} className="mt-6 space-y-4">
					<label className="block text-sm font-semibold text-(--sea-ink)">
						{t("auth.newPassword")}
						<input
							type="password"
							className="input-field mt-1 h-11 w-full rounded-xl px-3 text-sm"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							disabled={loading}
							required
							minLength={8}
							autoComplete="new-password"
						/>
					</label>

					<label className="block text-sm font-semibold text-(--sea-ink)">
						{t("auth.confirmPassword")}
						<input
							type="password"
							className="input-field mt-1 h-11 w-full rounded-xl px-3 text-sm"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							disabled={loading}
							required
							minLength={8}
							autoComplete="new-password"
						/>
					</label>

					{error && (
						<p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
							{error}
						</p>
					)}

					<button
						type="submit"
						disabled={loading}
						className="btn-brand h-11 w-full rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
					>
						{loading ? t("auth.resetting") : t("auth.resetPassword")}
					</button>
				</form>

				<p className="mt-4 text-sm font-semibold text-(--sea-ink-soft)">
					{t("auth.rememberPassword")}{" "}
					<Link
						to={withLang(lang, "/auth/login")}
						className="text-(--brand) no-underline hover:text-(--brand-strong)"
					>
						{t("auth.signIn")}
					</Link>
				</p>
			</div>
		</section>
	);
}
