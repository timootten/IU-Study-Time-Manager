import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import NotificationSettings from "#/components/dashboard/settings/NotificationSettings";
import { createServiceRouteErrorComponent } from "#/components/errors/RouteServiceError";
import { authClient } from "#/lib/auth-client";
import { ErrorCode, getErrorMessage } from "#/lib/errors/app-error";
import { getUserMessage } from "#/lib/errors/extract-error";
import type { SupportedLanguage } from "#/lib/i18n";
import { requireAuthSession } from "#/lib/server/require-auth";

const profileSettingsRouteErrorComponent = createServiceRouteErrorComponent({
	unavailableTitleKey: "errors.profileSettingsUnavailableTitle",
	fallbackTitleKey: "errors.profileSettingsLoadFailedTitle",
	fallbackDescriptionKey: "errors.profileSettingsLoadFailedDescription",
});

export const Route = createFileRoute("/$lang/profile/settings")({
	loader: async ({ params }) => {
		const session = await requireAuthSession({
			lang: params.lang as SupportedLanguage,
		});
		return { session };
	},
	errorComponent: profileSettingsRouteErrorComponent,
	component: ProfileSettingsPage,
});

function ProfileSettingsPage() {
	const { t } = useTranslation();
	const { session } = Route.useLoaderData();
	const currentName = session.user.name ?? "";
	const currentEmail = session.user.email ?? "";

	const [name, setName] = useState(currentName);
	const [email, setEmail] = useState(currentEmail);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [savingProfile, setSavingProfile] = useState(false);
	const [savingPassword, setSavingPassword] = useState(false);

	const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (savingProfile) return;
		setSavingProfile(true);
		try {
			const trimmedName = name.trim();
			const trimmedEmail = email.trim();
			if (trimmedName !== currentName) {
				const nameResult = await authClient.updateUser({ name: trimmedName });
				if (nameResult?.error) {
					toast.error(
						getUserMessage(
							nameResult.error,
							getErrorMessage(ErrorCode.NAME_UPDATE_FAILED),
						),
					);
					return;
				}
			}
			if (trimmedEmail !== currentEmail) {
				const emailResult = await authClient.changeEmail({
					newEmail: trimmedEmail,
				});
				if (emailResult?.error) {
					toast.error(
						getUserMessage(
							emailResult.error,
							getErrorMessage(ErrorCode.EMAIL_UPDATE_FAILED),
						),
					);
					return;
				}
			}
			toast.success(t("settings.profileUpdated"));
			await authClient.getSession();
		} catch (cause) {
			toast.error(
				getUserMessage(cause, getErrorMessage(ErrorCode.PROFILE_UPDATE_FAILED)),
			);
		} finally {
			setSavingProfile(false);
		}
	};

	const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (savingPassword) return;
		setSavingPassword(true);
		try {
			const response = await authClient.changePassword({
				currentPassword,
				newPassword,
			});
			if (response?.error) {
				toast.error(
					getUserMessage(
						response.error,
						getErrorMessage(ErrorCode.PASSWORD_CHANGE_FAILED),
					),
				);
				return;
			}
			setCurrentPassword("");
			setNewPassword("");
			toast.success(t("settings.passwordChanged"));
		} catch (cause) {
			toast.error(
				getUserMessage(
					cause,
					getErrorMessage(ErrorCode.PASSWORD_CHANGE_FAILED),
				),
			);
		} finally {
			setSavingPassword(false);
		}
	};

	return (
		<section className="page-wrap py-8 sm:py-12">
			<div className="grid gap-5 md:grid-cols-2">
				<article className="island-shell rounded-3xl p-6 sm:p-8">
					<p className="island-kicker m-0">{t("settings.profile")}</p>
					<h1 className="display-title mt-2 text-3xl sm:text-4xl">
						{t("settings.personalInfo")}
					</h1>
					<p className="mt-3 text-sm text-(--sea-ink-soft)">
						{t("settings.personalInfoDescription")}
					</p>
					<form className="mt-6 space-y-4" onSubmit={handleProfileSubmit}>
						<label className="block text-sm font-semibold text-(--sea-ink)">
							{t("settings.name")}
							<input
								className="input-field mt-1 h-11 w-full rounded-xl px-3 text-sm"
								value={name}
								onChange={(event) => setName(event.target.value)}
								required
								minLength={2}
								maxLength={80}
								autoComplete="name"
							/>
						</label>
						<label className="block text-sm font-semibold text-(--sea-ink)">
							{t("auth.email")}
							<input
								type="email"
								className="input-field mt-1 h-11 w-full rounded-xl px-3 text-sm"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								required
								autoComplete="email"
							/>
						</label>
						<button
							type="submit"
							disabled={savingProfile}
							className="btn-brand h-11 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
						>
							{savingProfile ? t("common.saving") : t("settings.saveProfile")}
						</button>
					</form>
				</article>

				<article className="island-shell rounded-3xl p-6 sm:p-8">
					<p className="island-kicker m-0">{t("settings.security")}</p>
					<h2 className="display-title mt-2 text-3xl">
						{t("settings.passwordTitle")}
					</h2>
					<p className="mt-3 text-sm text-(--sea-ink-soft)">
						{t("settings.securityDescription")}
					</p>
					<form className="mt-6 space-y-4" onSubmit={handlePasswordSubmit}>
						<label className="block text-sm font-semibold text-(--sea-ink)">
							{t("auth.currentPassword")}
							<input
								type="password"
								className="input-field mt-1 h-11 w-full rounded-xl px-3 text-sm"
								value={currentPassword}
								onChange={(event) => setCurrentPassword(event.target.value)}
								required
								autoComplete="current-password"
							/>
						</label>
						<label className="block text-sm font-semibold text-(--sea-ink)">
							{t("auth.newPassword")}
							<input
								type="password"
								className="input-field mt-1 h-11 w-full rounded-xl px-3 text-sm"
								value={newPassword}
								onChange={(event) => setNewPassword(event.target.value)}
								required
								minLength={8}
								autoComplete="new-password"
							/>
						</label>
						<button
							type="submit"
							disabled={savingPassword}
							className="btn-brand h-11 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
						>
							{savingPassword
								? t("common.updating")
								: t("settings.changePassword")}
						</button>
					</form>
				</article>
			</div>
			<div className="mt-5">
				<NotificationSettings />
			</div>
		</section>
	);
}
