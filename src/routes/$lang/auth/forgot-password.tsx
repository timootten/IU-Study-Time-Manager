import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { createServiceRouteErrorComponent } from "#/components/errors/RouteServiceError";
import { authClient } from "#/lib/auth-client";
import { getAuthErrorMessage } from "#/lib/errors/extract-error";
import i18n, { type SupportedLanguage } from "#/lib/i18n";
import { useLangParam, withLang } from "#/lib/i18n/paths";
import { seoHead } from "#/lib/i18n/seo";
import { getAuthSession } from "#/lib/server/auth-session";
import { requireServiceAvailability } from "#/lib/server/require-service-availability";

const forgotPasswordErrorComponent = createServiceRouteErrorComponent({
	unavailableTitleKey: "errors.resetUnavailableTitle",
	fallbackTitleKey: "errors.resetLoadFailedTitle",
	fallbackDescriptionKey: "errors.resetLoadFailedDescription",
});

export const Route = createFileRoute("/$lang/auth/forgot-password")({
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
			"forgotPasswordTitle",
			"forgotPasswordDescription",
			params.lang as SupportedLanguage,
			"/auth/forgot-password",
		),
	errorComponent: forgotPasswordErrorComponent,
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const { t } = useTranslation();
	const lang = useLangParam();
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sent, setSent] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const { error: apiError } = await authClient.requestPasswordReset({
				email: email.trim(),
				redirectTo: withLang(lang, "/auth/password-reset"),
			});

			if (apiError) {
				setError(getAuthErrorMessage(apiError));
				return;
			}

			setSent(true);
		} catch (cause) {
			setError(getAuthErrorMessage(cause));
		} finally {
			setLoading(false);
		}
	};

	return (
		<section className="page-wrap py-8 sm:py-14">
			<div className="mx-auto w-full max-w-md rounded-3xl border border-(--line) bg-(--surface-strong) p-6 shadow-[0_22px_48px_rgba(16,47,55,0.14)] sm:p-8">
				<p className="island-kicker m-0">{t("auth.kicker")}</p>
				<h1 className="display-title mt-2 text-3xl sm:text-4xl">
					{t("auth.resetPasswordTitle")}
				</h1>

				{sent ? (
					<div className="mt-6">
						<div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
							<p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
								{t("auth.resetEmailHeadline")}
							</p>
							<p className="mt-1.5 text-sm text-emerald-700 dark:text-emerald-300">
								{t("auth.resetEmailDescription", { email })}
							</p>
						</div>

						<p className="mt-5 text-sm text-(--sea-ink-soft)">
							{t("auth.resetEmailNoReceive")}{" "}
							<button
								type="button"
								onClick={() => {
									setSent(false);
									setError(null);
								}}
								className="font-semibold text-(--brand) hover:text-(--brand-strong)"
							>
								{t("auth.tryAgain")}
							</button>
							.
						</p>

						<Link
							to={withLang(lang, "/auth/login")}
							className="mt-4 inline-block text-sm font-semibold text-(--brand) no-underline hover:text-(--brand-strong)"
						>
							{t("auth.backToSignIn")}
						</Link>
					</div>
				) : (
					<>
						<p className="mt-2 text-sm text-(--sea-ink-soft)">
							{t("auth.resetPasswordSubtitle")}
						</p>

						<form onSubmit={handleSubmit} className="mt-6 space-y-4">
							<label className="block text-sm font-semibold text-(--sea-ink)">
								{t("auth.email")}
								<input
									type="email"
									className="input-field mt-1 h-11 w-full rounded-xl px-3 text-sm"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									disabled={loading}
									required
									autoComplete="email"
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
								{loading ? t("auth.sendingResetLink") : t("auth.sendResetLink")}
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
					</>
				)}
			</div>
		</section>
	);
}
