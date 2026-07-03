import { Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { authClient } from "#/lib/auth-client";
import { ErrorCode, getErrorMessage } from "#/lib/errors/app-error";
import { getAuthErrorMessage } from "#/lib/errors/extract-error";
import { useLangParam, withLang } from "#/lib/i18n/paths";

type AuthMode = "sign-in" | "register";

interface AuthCardProps {
	mode: AuthMode;
}

export default function AuthCard({ mode }: AuthCardProps) {
	const { t } = useTranslation();
	const lang = useLangParam();
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isRegister = mode === "register";

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		setError(null);
		setLoading(true);

		try {
			const payload = {
				email: email.trim(),
				password,
			};

			const response = isRegister
				? await authClient.signUp.email({
						name: name.trim(),
						...payload,
					})
				: await authClient.signIn.email(payload);

			if (response?.error) {
				setError(getAuthErrorMessage(response.error));
				return;
			}

			if (!response?.data?.user) {
				setError(getErrorMessage(ErrorCode.LOGIN_INCOMPLETE));
				return;
			}

			toast.success(
				isRegister ? t("auth.registerSuccess") : t("auth.loginSuccess"),
			);

			await navigate({ to: withLang(lang, "/dashboard") });
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
					{isRegister ? t("auth.registerTitle") : t("auth.loginTitle")}
				</h1>
				<p className="mt-2 text-sm text-(--sea-ink-soft)">
					{isRegister ? t("auth.registerSubtitle") : t("auth.loginSubtitle")}
				</p>

				<form onSubmit={handleSubmit} className="mt-6 space-y-4">
					{isRegister ? (
						<label className="block text-sm font-semibold text-(--sea-ink)">
							{t("auth.name")}
							<input
								className="input-field mt-1 h-11 w-full rounded-xl px-3 text-sm"
								value={name}
								onChange={(event) => setName(event.target.value)}
								disabled={loading}
								required
								minLength={2}
								maxLength={80}
								autoComplete="name"
							/>
						</label>
					) : null}

					<label className="block text-sm font-semibold text-(--sea-ink)">
						{t("auth.email")}
						<input
							type="email"
							className="input-field mt-1 h-11 w-full rounded-xl px-3 text-sm"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							disabled={loading}
							required
							autoComplete="email"
						/>
					</label>

					<label className="block text-sm font-semibold text-(--sea-ink)">
						{t("auth.password")}
						<input
							type="password"
							className="input-field mt-1 h-11 w-full rounded-xl px-3 text-sm"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							disabled={loading}
							required
							minLength={8}
							autoComplete={isRegister ? "new-password" : "current-password"}
						/>
					</label>

					{!isRegister && (
						<div className="text-right">
							<Link
								to={withLang(lang, "/auth/forgot-password")}
								className="text-xs font-semibold text-(--brand) no-underline hover:text-(--brand-strong)"
							>
								{t("auth.forgotPassword")}
							</Link>
						</div>
					)}

					{error ? (
						<p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
							{error}
						</p>
					) : null}

					<button
						type="submit"
						disabled={loading}
						className="btn-brand h-11 w-full rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
					>
						{loading
							? t("common.pleaseWait")
							: isRegister
								? t("auth.createAccount")
								: t("auth.signIn")}
					</button>
				</form>

				<p className="mt-4 text-sm font-semibold text-(--sea-ink-soft)">
					{isRegister
						? t("auth.alreadyHaveAccount")
						: t("auth.dontHaveAccount")}{" "}
					<Link
						to={withLang(lang, isRegister ? "/auth/login" : "/auth/register")}
						className="text-(--brand) no-underline hover:text-(--brand-strong)"
					>
						{isRegister ? t("auth.signIn") : t("auth.signUp")}
					</Link>
				</p>
			</div>
		</section>
	);
}
