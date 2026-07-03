import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import DashboardModal from "#/components/dashboard/ui/DashboardModal";
import { changeAdminUserPassword, updateAdminUser } from "#/lib/server/admin";

interface AdminUserEditModalUser {
	id: string;
	name: string;
	email: string;
	role: string;
	emailVerified?: boolean | null;
	banned?: boolean | null;
	banReason?: string | null;
}

type AdminUserEditModalProps = {
	user: AdminUserEditModalUser;
	onClose: () => void;
};

export default function AdminUserEditModal({
	user,
	onClose,
}: AdminUserEditModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	// Form state
	const [name, setName] = useState(user.name);
	const [email, setEmail] = useState(user.email);
	const [role, setRole] = useState(user.role);
	const [emailVerified, setEmailVerified] = useState(
		user.emailVerified ?? false,
	);

	// Ban state
	const [banned, setBanned] = useState(user.banned ?? false);
	const [banReasonInput, setBanReasonInput] = useState(user.banReason ?? "");

	// Password change state
	const [newPassword, setNewPassword] = useState("");
	const [passwordMode, setPasswordMode] = useState(false);

	const updateMutation = useMutation({
		mutationFn: () =>
			updateAdminUser({
				data: {
					userId: user.id,
					name,
					email,
					role,
					emailVerified,
					banned,
					banReason: banned ? banReasonInput : null,
				},
			}),
		onSuccess: () => {
			toast.success(t("admin.userUpdated"));
			queryClient.invalidateQueries({
				queryKey: ["admin", "userDetail", user.id],
			});
			queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
			onClose();
		},
		onError: () => {
			toast.error(t("common.somethingWentWrong"));
		},
	});

	const passwordMutation = useMutation({
		mutationFn: () =>
			changeAdminUserPassword({
				data: {
					userId: user.id,
					newPassword,
				},
			}),
		onSuccess: () => {
			toast.success(t("admin.passwordChanged"));
			setNewPassword("");
			setPasswordMode(false);
		},
		onError: () => {
			toast.error(t("common.somethingWentWrong"));
		},
	});

	const isPending = updateMutation.isPending || passwordMutation.isPending;

	return (
		<DashboardModal
			open
			title={t("admin.editUserTitle")}
			onClose={onClose}
			footer={
				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="rounded-lg border border-(--line) bg-(--surface-strong) px-4 py-2 text-xs font-semibold text-(--sea-ink) hover:bg-(--link-bg-hover) disabled:opacity-50"
					>
						{t("common.cancel")}
					</button>
					<button
						type="button"
						onClick={() => updateMutation.mutate()}
						disabled={isPending}
						className="rounded-lg bg-(--brand) px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
					>
						{updateMutation.isPending ? t("common.saving") : t("common.save")}
					</button>
				</div>
			}
		>
			<div className="space-y-6">
				{/* Basic Information */}
				<section>
					<h3 className="mb-3 text-sm font-semibold text-(--sea-ink)">
						{t("admin.basicInformation")}
					</h3>
					<div className="space-y-4">
						<div>
							<label
								htmlFor="edit-name"
								className="mb-1.5 block text-xs font-medium text-(--sea-ink-soft)"
							>
								{t("common.name")}
							</label>
							<input
								id="edit-name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="h-9 w-full rounded-lg border border-(--line) bg-background px-3 text-sm text-(--sea-ink) transition focus:border-(--brand) focus:outline-none focus:ring-1 focus:ring-(--brand)/30"
							/>
						</div>
						<div>
							<label
								htmlFor="edit-email"
								className="mb-1.5 block text-xs font-medium text-(--sea-ink-soft)"
							>
								{t("auth.email")}
							</label>
							<input
								id="edit-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="h-9 w-full rounded-lg border border-(--line) bg-background px-3 text-sm text-(--sea-ink) transition focus:border-(--brand) focus:outline-none focus:ring-1 focus:ring-(--brand)/30"
							/>
						</div>
						<div>
							<label
								htmlFor="edit-role"
								className="mb-1.5 block text-xs font-medium text-(--sea-ink-soft)"
							>
								{t("admin.role")}
							</label>
							<select
								id="edit-role"
								value={role}
								onChange={(e) => setRole(e.target.value)}
								className="h-9 w-full rounded-lg border border-(--line) bg-background px-3 text-sm text-(--sea-ink) transition focus:border-(--brand) focus:outline-none"
							>
								<option value="user">User</option>
								<option value="admin">Admin</option>
							</select>
						</div>
						<div className="flex items-center justify-between rounded-lg border border-(--line) px-4 py-3">
							<div>
								<p className="text-sm font-medium text-(--sea-ink)">
									{t("auth.emailVerified")}
								</p>
								<p className="text-xs text-(--sea-ink-soft)">
									{t("admin.emailVerifiedDescription")}
								</p>
							</div>
							<button
								type="button"
								onClick={() => setEmailVerified(!emailVerified)}
								className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
									emailVerified
										? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
										: "bg-(--sea-ink-soft)/10 text-(--sea-ink-soft)"
								}`}
							>
								{emailVerified ? (
									<CheckCircle2 size={14} />
								) : (
									<XCircle size={14} />
								)}
								{emailVerified ? t("common.yes") : t("common.no")}
							</button>
						</div>
					</div>
				</section>

				<hr className="border-(--line)" />

				{/* Change Password */}
				<section>
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold text-(--sea-ink)">
							{t("settings.passwordTitle")}
						</h3>
						{!passwordMode && (
							<button
								type="button"
								onClick={() => setPasswordMode(true)}
								className="rounded-lg border border-(--line) bg-(--surface-strong) px-3 py-1.5 text-xs font-semibold text-(--sea-ink) hover:bg-(--link-bg-hover)"
							>
								{t("admin.changePassword")}
							</button>
						)}
					</div>
					{passwordMode && (
						<div className="mt-3 space-y-3">
							<div>
								<label
									htmlFor="edit-password"
									className="mb-1.5 block text-xs font-medium text-(--sea-ink-soft)"
								>
									{t("auth.newPassword")}
								</label>
								<input
									id="edit-password"
									type="password"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									placeholder="••••••••"
									className="h-9 w-full rounded-lg border border-(--line) bg-background px-3 text-sm text-(--sea-ink) transition focus:border-(--brand) focus:outline-none focus:ring-1 focus:ring-(--brand)/30"
								/>
							</div>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => {
										setPasswordMode(false);
										setNewPassword("");
									}}
									disabled={passwordMutation.isPending}
									className="rounded-lg border border-(--line) bg-(--surface-strong) px-3 py-1.5 text-xs font-semibold text-(--sea-ink) hover:bg-(--link-bg-hover) disabled:opacity-50"
								>
									{t("common.cancel")}
								</button>
								<button
									type="button"
									onClick={() => passwordMutation.mutate()}
									disabled={
										passwordMutation.isPending || newPassword.length < 8
									}
									className="inline-flex items-center gap-1.5 rounded-lg bg-(--brand) px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
								>
									{passwordMutation.isPending && (
										<Loader2 size={14} className="animate-spin" />
									)}
									{passwordMutation.isPending
										? t("common.saving")
										: t("admin.setPassword")}
								</button>
							</div>
						</div>
					)}
				</section>

				<hr className="border-(--line)" />

				{/* Ban / Suspend User */}
				<section>
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-sm font-semibold text-(--sea-ink)">
								{t("admin.banUser")}
							</h3>
							<p className="text-xs text-(--sea-ink-soft)">
								{t("admin.banDescription")}
							</p>
						</div>
						<button
							type="button"
							onClick={() => {
								setBanned(!banned);
								if (banned) setBanReasonInput("");
							}}
							className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
								banned
									? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
									: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
							}`}
						>
							{banned ? <CheckCircle2 size={14} /> : <Ban size={14} />}
							{banned ? t("admin.unbanUser") : t("admin.banUserAction")}
						</button>
					</div>
					{banned && (
						<div className="mt-3">
							<label
								htmlFor="edit-ban-reason"
								className="mb-1.5 block text-xs font-medium text-(--sea-ink-soft)"
							>
								{t("admin.banReason")}
							</label>
							<textarea
								id="edit-ban-reason"
								value={banReasonInput}
								onChange={(e) => setBanReasonInput(e.target.value)}
								placeholder={t("admin.banReasonPlaceholder")}
								rows={3}
								className="h-20 w-full resize-none rounded-lg border border-(--line) bg-background px-3 py-2 text-sm text-(--sea-ink) transition focus:border-(--brand) focus:outline-none focus:ring-1 focus:ring-(--brand)/30"
							/>
						</div>
					)}
				</section>
			</div>
		</DashboardModal>
	);
}
