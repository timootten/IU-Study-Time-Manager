import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, Loader2, Mail, Smartphone } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getUserMessage } from "#/lib/errors/extract-error";
import {
	getExistingSubscription,
	isPushSupported,
	pushSubscriptionToPayload,
	requestNotificationPermission,
	subscribeToPush,
	unsubscribeFromPush,
} from "#/lib/push-notifications";
import {
	getNotificationPreferences,
	subscribePush,
	unsubscribePush,
	updateNotificationPreferences,
} from "#/lib/server/notifications/api";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

function hourLabel(h: number): string {
	return `${String(h).padStart(2, "0")}:00`;
}

export default function NotificationSettings() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [togglingPush, setTogglingPush] = useState(false);
	const [pushSubscribed, setPushSubscribed] = useState<boolean | null>(null);

	const { data: prefs, isLoading: prefsLoading } = useQuery({
		queryKey: ["notification-preferences"],
		queryFn: async () => {
			const [result, existingSub] = await Promise.all([
				getNotificationPreferences(),
				getExistingSubscription(),
			]);
			setPushSubscribed(!!existingSub);
			return result;
		},
	});

	const preferencesMutation = useMutation({
		mutationFn: updateNotificationPreferences,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["notification-preferences"],
			});
			toast.success(t("toast.notificationsSaved"));
		},
		onError: (err) =>
			toast.error(
				getUserMessage(err, "Failed to update notification preferences."),
			),
	});

	const handlePushToggle = async () => {
		setTogglingPush(true);
		try {
			const supported = await isPushSupported();
			if (!supported) {
				toast.error(t("toast.pushNotSupported"));
				return;
			}

			const existing = await getExistingSubscription();

			if (existing) {
				// Turn off: unsubscribe
				await unsubscribePush({
					data: { endpoint: existing.endpoint },
				});
				await unsubscribeFromPush();
				setPushSubscribed(false);
				preferencesMutation.mutate({ data: { pushEnabled: false } });
			} else {
				// Turn on: request permission & subscribe
				const permission = await requestNotificationPermission();
				if (permission !== "granted") {
					toast.error(
						"Notification permission denied. Please enable it in your browser settings.",
					);
					return;
				}

				const subscription = await subscribeToPush();
				if (!subscription) {
					toast.error(t("toast.pushSubscribeFailed"));
					return;
				}

				await subscribePush({
					data: pushSubscriptionToPayload(subscription),
				});
				setPushSubscribed(true);
				preferencesMutation.mutate({ data: { pushEnabled: true } });
			}
		} catch (err) {
			toast.error(getUserMessage(err, "Failed to toggle push notifications."));
		} finally {
			setTogglingPush(false);
		}
	};

	if (prefsLoading) {
		return (
			<article className="island-shell rounded-3xl p-6 sm:p-8 md:col-span-2">
				<div className="flex items-center justify-center py-12">
					<Loader2 size={20} className="animate-spin text-(--sea-ink-soft)" />
				</div>
			</article>
		);
	}

	const pushActive = pushSubscribed && prefs?.pushEnabled !== false;

	return (
		<article className="island-shell rounded-3xl p-6 sm:p-8 md:col-span-2">
			<p className="island-kicker m-0">{t("settings.notifications")}</p>
			<h2 className="display-title mt-2 text-3xl sm:text-4xl">
				{t("settings.sessionReminders")}
			</h2>
			<p className="mt-3 text-sm text-(--sea-ink-soft)">
				{t("settings.notificationsDescription")}
			</p>

			<div className="mt-6 space-y-6">
				{/* Email Notifications */}
				<div className="flex items-start justify-between gap-4 rounded-xl border border-(--line) bg-(--surface) p-4">
					<div className="flex items-start gap-3">
						<div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--brand)/10">
							<Mail size={16} className="text-(--brand)" />
						</div>
						<div>
							<p className="text-sm font-semibold text-(--sea-ink)">
								{t("settings.emailReminders")}
							</p>
							<p className="mt-0.5 text-xs text-(--sea-ink-soft)">
								{t("settings.emailRemindersDescription")}
							</p>
							{prefs?.emailEnabled !== false && (
								<div className="mt-2">
									<label className="text-xs font-medium text-(--sea-ink-soft)">
										{t("settings.sendMinutesBefore")}{" "}
										<select
											value={prefs?.emailLeadMinutes ?? 30}
											onChange={(e) =>
												preferencesMutation.mutate({
													data: {
														emailLeadMinutes: Number(e.target.value),
													},
												})
											}
											className="mx-1 rounded-lg border border-(--line) bg-(--surface-strong) px-1.5 py-0.5 text-xs font-semibold text-(--sea-ink)"
										>
											<option value={5}>5</option>
											<option value={15}>15</option>
											<option value={30}>30</option>
											<option value={60}>60</option>
										</select>{" "}
										{t("settings.minutesBefore")}
									</label>
								</div>
							)}
						</div>
					</div>
					<button
						type="button"
						aria-label={t("settings.toggleEmailNotifications")}
						className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
							prefs?.emailEnabled !== false ? "bg-(--brand)" : "bg-(--line)"
						}`}
						onClick={() =>
							preferencesMutation.mutate({
								data: { emailEnabled: prefs?.emailEnabled === false },
							})
						}
					>
						<span
							className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
								prefs?.emailEnabled !== false
									? "translate-x-5"
									: "translate-x-0"
							}`}
						/>
					</button>
				</div>

				{/* Push Notifications */}
				<div className="flex items-start justify-between gap-4 rounded-xl border border-(--line) bg-(--surface) p-4">
					<div className="flex items-start gap-3">
						<div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--brand)/10">
							<Smartphone size={16} className="text-(--brand)" />
						</div>
						<div>
							<p className="text-sm font-semibold text-(--sea-ink)">
								{t("settings.pushNotifications")}
							</p>
							<p className="mt-0.5 text-xs text-(--sea-ink-soft)">
								{t("settings.pushDescription")}
							</p>
							{pushActive && (
								<div className="mt-2">
									<label className="text-xs font-medium text-(--sea-ink-soft)">
										{t("settings.notifyMinutesBefore")}{" "}
										<select
											value={prefs?.pushLeadMinutes ?? 5}
											onChange={(e) =>
												preferencesMutation.mutate({
													data: {
														pushLeadMinutes: Number(e.target.value),
													},
												})
											}
											className="mx-1 rounded-lg border border-(--line) bg-(--surface-strong) px-1.5 py-0.5 text-xs font-semibold text-(--sea-ink)"
										>
											<option value={1}>1</option>
											<option value={5}>5</option>
											<option value={15}>15</option>
										</select>{" "}
										{t("settings.minuteOrMinutesBefore")}
									</label>
								</div>
							)}
						</div>
					</div>
					<button
						type="button"
						disabled={togglingPush}
						aria-label={
							pushActive
								? t("settings.disablePushNotifications")
								: t("settings.enablePushNotifications")
						}
						className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
							pushActive ? "bg-(--brand)" : "bg-(--line)"
						}`}
						onClick={handlePushToggle}
					>
						{togglingPush ? (
							<Loader2
								size={12}
								className="absolute inset-0 m-auto animate-spin text-white"
							/>
						) : (
							<span
								className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
									pushActive ? "translate-x-5" : "translate-x-0"
								}`}
							/>
						)}
					</button>
				</div>

				{/* Quiet Hours */}
				<div className="rounded-xl border border-(--line) bg-(--surface) p-4">
					<div className="flex items-start justify-between gap-4">
						<div className="flex items-start gap-3">
							<div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--brand)/10">
								{prefs?.quietHourStart != null &&
								prefs?.quietHourEnd != null ? (
									<BellOff size={16} className="text-(--brand)" />
								) : (
									<Bell size={16} className="text-(--brand)" />
								)}
							</div>
							<div>
								<p className="text-sm font-semibold text-(--sea-ink)">
									{t("settings.quietHours")}
								</p>
								<p className="mt-0.5 text-xs text-(--sea-ink-soft)">
									{t("settings.quietHoursDescription")}
								</p>
							</div>
						</div>
						<button
							type="button"
							aria-label={
								prefs?.quietHourStart != null
									? t("settings.disableQuietHours")
									: t("settings.enableQuietHours")
							}
							className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
								prefs?.quietHourStart != null ? "bg-(--brand)" : "bg-(--line)"
							}`}
							onClick={() =>
								preferencesMutation.mutate({
									data:
										prefs?.quietHourStart != null
											? {
													quietHourStart: null,
													quietHourEnd: null,
												}
											: {
													quietHourStart: 22,
													quietHourEnd: 7,
												},
								})
							}
						>
							<span
								className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
									prefs?.quietHourStart != null
										? "translate-x-5"
										: "translate-x-0"
								}`}
							/>
						</button>
					</div>

					{prefs?.quietHourStart != null && prefs?.quietHourEnd != null && (
						<div className="mt-4 flex items-center gap-3">
							<label className="text-xs font-semibold text-(--sea-ink)">
								{t("common.from")}
								<select
									value={prefs.quietHourStart}
									onChange={(e) =>
										preferencesMutation.mutate({
											data: {
												quietHourStart: Number(e.target.value),
											},
										})
									}
									className="mx-1.5 rounded-lg border border-(--line) bg-(--surface-strong) px-2 py-1 text-xs font-semibold text-(--sea-ink)"
								>
									{HOUR_OPTIONS.map((h) => (
										<option key={h} value={h}>
											{hourLabel(h)}
										</option>
									))}
								</select>
							</label>
							<span className="text-xs text-(--sea-ink-soft)">
								{t("settings.to")}
							</span>
							<label className="text-xs font-semibold text-(--sea-ink)">
								<select
									value={prefs.quietHourEnd}
									onChange={(e) =>
										preferencesMutation.mutate({
											data: {
												quietHourEnd: Number(e.target.value),
											},
										})
									}
									className="ml-1.5 rounded-lg border border-(--line) bg-(--surface-strong) px-2 py-1 text-xs font-semibold text-(--sea-ink)"
								>
									{HOUR_OPTIONS.map((h) => (
										<option key={h} value={h}>
											{hourLabel(h)}
										</option>
									))}
								</select>
							</label>
						</div>
					)}
				</div>
			</div>
		</article>
	);
}
