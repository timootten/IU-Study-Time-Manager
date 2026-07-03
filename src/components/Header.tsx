import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, Settings, Shield, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { authClient } from "#/lib/auth-client";
import { useLangParam, withLang } from "#/lib/i18n/paths";
import PwaInstallButton from "./PwaInstallButton";
import SettingsButton from "./QuickSettingsButton";

type SessionUser = {
	email?: string | null;
	name?: string | null;
	image?: string | null;
	role?: string | null;
};

type HeaderSession = {
	user?: SessionUser | null;
} | null;

interface HeaderProps {
	initialSession: HeaderSession;
}

const OFFLINE_SESSION_KEY = "stm-offline-session";

function readOfflineSession(): HeaderSession {
	if (typeof window === "undefined") {
		return null;
	}

	try {
		const rawValue = window.localStorage.getItem(OFFLINE_SESSION_KEY);
		if (!rawValue) {
			return null;
		}

		const parsed = JSON.parse(rawValue) as HeaderSession;
		if (!parsed?.user) {
			return null;
		}

		return parsed;
	} catch {
		return null;
	}
}

export default function Header({ initialSession }: HeaderProps) {
	const { t } = useTranslation();
	const lang = useLangParam();
	const navigate = useNavigate();
	const location = useLocation();
	const { data: clientSession } = authClient.useSession();
	const [offlineSession, setOfflineSession] = useState<HeaderSession>(() =>
		readOfflineSession(),
	);
	const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
	const session =
		clientSession ?? initialSession ?? (isOffline ? offlineSession : null);
	const user = session?.user;
	const logoTarget = user ? withLang(lang, "/dashboard") : withLang(lang, "/");
	const displayName =
		user?.name?.trim() || t("nav.welcome").split(",")[0]?.trim() || "there";
	const firstName = displayName.split(/\s+/)[0] || "there";
	const isInDashboardSection = location.pathname.includes("/dashboard");
	const [accountMenuOpen, setAccountMenuOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isSigningOut, setIsSigningOut] = useState(false);
	const accountMenuRef = useRef<HTMLDivElement | null>(null);
	const mobileMenuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		setMobileMenuOpen(false);
		setAccountMenuOpen(false);
	}, []);

	useEffect(() => {
		if (!session?.user || typeof window === "undefined") {
			return;
		}

		const serialized = JSON.stringify({ user: session.user });
		window.localStorage.setItem(OFFLINE_SESSION_KEY, serialized);
		setOfflineSession({ user: session.user });
	}, [session]);

	useEffect(() => {
		if (!accountMenuOpen && !mobileMenuOpen) {
			return;
		}

		const onPointerDown = (event: MouseEvent) => {
			const target = event.target as Node;
			const clickedAccountMenu =
				accountMenuRef.current?.contains(target) ?? false;
			const clickedMobileMenu =
				mobileMenuRef.current?.contains(target) ?? false;

			if (!clickedAccountMenu) {
				setAccountMenuOpen(false);
			}

			if (!clickedMobileMenu) {
				setMobileMenuOpen(false);
			}
		};

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setAccountMenuOpen(false);
				setMobileMenuOpen(false);
			}
		};

		document.addEventListener("mousedown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);

		return () => {
			document.removeEventListener("mousedown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [accountMenuOpen, mobileMenuOpen]);

	const handleSignOut = async () => {
		if (isSigningOut) {
			return;
		}

		setIsSigningOut(true);

		try {
			const response = await authClient.signOut();

			if (response?.error) {
				toast.error(t("auth.signOutFailed"));
				return;
			}

			setAccountMenuOpen(false);
			setMobileMenuOpen(false);
			if (typeof window !== "undefined") {
				window.localStorage.removeItem(OFFLINE_SESSION_KEY);
			}
			setOfflineSession(null);
			toast.success(t("auth.signOutSuccess"));
			await navigate({ to: withLang(lang, "/auth/login") });
		} catch {
			toast.error(t("auth.signOutFailed"));
		} finally {
			setIsSigningOut(false);
		}
	};

	const accountActionClass =
		"flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-(--sea-ink) no-underline transition hover:bg-(--link-bg-hover)";

	return (
		<header className="sticky top-0 z-50 border-b border-(--line) bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
			<nav className="page-wrap relative py-3 sm:py-4">
				<div className="flex items-center gap-2">
					<h2 className="m-0 shrink-0 text-base font-semibold tracking-tight">
						<Link
							to={logoTarget}
							className="inline-flex items-center gap-2 rounded-full border border-(--chip-line) bg-(--chip-bg) px-3 py-1.5 text-sm text-(--sea-ink) no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
						>
							<span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,var(--brand),var(--brand-strong))]" />
							{t("meta.siteTitle")}
						</Link>
					</h2>

					<div className="ml-auto flex items-center gap-2">
						<div className="hidden items-center gap-2 sm:flex">
							<PwaInstallButton
								className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-(--chip-line) bg-(--chip-bg) px-4 text-sm font-semibold leading-none text-(--sea-ink)"
								label={t("pwa.install")}
							/>

							{user && !isInDashboardSection ? (
								<Link
									to={withLang(lang, "/dashboard")}
									className="btn-brand inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold leading-none no-underline"
								>
									{t("nav.dashboard")}
								</Link>
							) : null}

							{!user ? (
								<>
									<Link
										to={withLang(lang, "/auth/register")}
										className="btn-brand inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold leading-none no-underline"
									>
										{t("nav.register")}
									</Link>
									<Link
										to={withLang(lang, "/auth/login")}
										className="inline-flex h-10 items-center justify-center rounded-full border border-(--chip-line) bg-(--chip-bg) px-4 text-sm font-semibold leading-none text-(--sea-ink) no-underline"
									>
										{t("nav.login")}
									</Link>
								</>
							) : null}
						</div>

						{user ? (
							<div className="relative" ref={accountMenuRef}>
								<button
									type="button"
									className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-(--chip-line) bg-(--chip-bg) text-(--sea-ink)"
									aria-haspopup="menu"
									aria-expanded={accountMenuOpen}
									aria-label={t("nav.openAccountMenu")}
									onClick={() =>
										setAccountMenuOpen((currentValue) => !currentValue)
									}
								>
									{user.image ? (
										<img
											src={user.image}
											alt={user.name || "User"}
											className="h-10 w-10 rounded-full object-cover"
										/>
									) : (
										<UserRound size={18} aria-hidden="true" />
									)}
								</button>
								{accountMenuOpen ? (
									<div
										className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-(--line) bg-(--surface-strong) p-2 shadow-[0_12px_28px_rgba(16,47,55,0.16)]"
										role="menu"
									>
										<p className="px-3 py-2 text-sm font-semibold text-(--sea-ink-soft)">
											{t("nav.welcome", { name: firstName })}
										</p>
										{user?.role === "admin" ? (
											<Link
												to={withLang(lang, "/admin")}
												className={accountActionClass}
												onClick={() => setAccountMenuOpen(false)}
											>
												<Shield size={16} aria-hidden="true" />
												{t("nav.admin")}
											</Link>
										) : null}
										<Link
											to={withLang(lang, "/profile/settings")}
											className={accountActionClass}
											onClick={() => setAccountMenuOpen(false)}
										>
											<Settings size={16} aria-hidden="true" />
											{t("nav.settings")}
										</Link>
										<button
											type="button"
											disabled={isSigningOut}
											className={`${accountActionClass} disabled:cursor-not-allowed disabled:opacity-60`}
											onClick={() => {
												void handleSignOut();
											}}
										>
											<LogOut size={16} aria-hidden="true" />
											{isSigningOut ? t("nav.signingOut") : t("nav.logout")}
										</button>
									</div>
								) : null}
							</div>
						) : null}

						<SettingsButton />

						<button
							type="button"
							className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--chip-line) bg-(--chip-bg) text-(--sea-ink) sm:hidden"
							aria-expanded={mobileMenuOpen}
							aria-controls="mobile-site-menu"
							aria-label={t("nav.toggleNavMenu")}
							onClick={() => setMobileMenuOpen((currentValue) => !currentValue)}
						>
							{mobileMenuOpen ? (
								<X size={18} aria-hidden="true" />
							) : (
								<Menu size={18} aria-hidden="true" />
							)}
						</button>
					</div>
				</div>

				<div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-6 text-sm font-semibold sm:flex">
					<Link
						to={withLang(lang, "/")}
						className="nav-link"
						activeProps={{ className: "nav-link is-active" }}
						activeOptions={{ exact: true }}
					>
						{t("nav.home")}
					</Link>
					<Link
						to={withLang(lang, "/about")}
						className="nav-link"
						activeProps={{ className: "nav-link is-active" }}
					>
						{t("nav.about")}
					</Link>
					{user?.role === "admin" ? (
						<Link
							to={withLang(lang, "/admin")}
							className="nav-link"
							activeProps={{ className: "nav-link is-active" }}
							activeOptions={{ exact: true }}
						>
							{t("nav.admin")}
						</Link>
					) : null}
				</div>

				<div
					id="mobile-site-menu"
					ref={mobileMenuRef}
					className={`${mobileMenuOpen ? "mt-3 grid" : "hidden"} gap-2 rounded-2xl border border-(--line) bg-(--surface-strong) p-2 shadow-[0_14px_28px_rgba(16,47,55,0.14)] sm:hidden`}
				>
					<Link
						to={withLang(lang, "/")}
						className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-(--sea-ink) no-underline hover:bg-(--link-bg-hover)"
						onClick={() => {
							setMobileMenuOpen(false);
						}}
					>
						{t("nav.home")}
					</Link>
					<Link
						to={withLang(lang, "/about")}
						className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-(--sea-ink) no-underline hover:bg-(--link-bg-hover)"
						onClick={() => {
							setMobileMenuOpen(false);
						}}
					>
						{t("nav.about")}
					</Link>

					{user?.role === "admin" ? (
						<Link
							to={withLang(lang, "/admin")}
							className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-(--sea-ink) no-underline hover:bg-(--link-bg-hover)"
							onClick={() => {
								setMobileMenuOpen(false);
							}}
						>
							<Shield size={16} className="mr-2 inline-block" />
							{t("nav.admin")}
						</Link>
					) : null}

					{user && !isInDashboardSection ? (
						<Link
							to={withLang(lang, "/dashboard")}
							className="btn-brand inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold leading-none no-underline"
							onClick={() => {
								setMobileMenuOpen(false);
							}}
						>
							{t("nav.dashboard")}
						</Link>
					) : null}

					{!user ? (
						<div className="grid grid-cols-2 gap-2 pt-1">
							<Link
								to={withLang(lang, "/auth/register")}
								className="btn-brand inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold leading-none no-underline"
								onClick={() => setMobileMenuOpen(false)}
							>
								{t("nav.register")}
							</Link>
							<Link
								to={withLang(lang, "/auth/login")}
								className="inline-flex h-11 items-center justify-center rounded-xl border border-(--chip-line) bg-(--chip-bg) px-4 text-sm font-semibold leading-none text-(--sea-ink) no-underline"
								onClick={() => setMobileMenuOpen(false)}
							>
								{t("nav.login")}
							</Link>
						</div>
					) : null}

					<PwaInstallButton
						className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-(--chip-line) bg-(--chip-bg) px-4 text-sm font-semibold leading-none text-(--sea-ink)"
						label={t("pwa.installOnDevice")}
					/>
				</div>
			</nav>
		</header>
	);
}
