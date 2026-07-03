import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

interface PwaInstallButtonProps {
	className?: string;
	label?: string;
}

export default function PwaInstallButton({
	className,
	label = "Install app",
}: PwaInstallButtonProps) {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [isInstalled, setIsInstalled] = useState(false);

	useEffect(() => {
		const isStandalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			(window.navigator as Navigator & { standalone?: boolean }).standalone ===
				true;

		if (isStandalone) {
			setIsInstalled(true);
			return;
		}

		const onBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			setDeferredPrompt(event as BeforeInstallPromptEvent);
		};

		const onAppInstalled = () => {
			setIsInstalled(true);
			setDeferredPrompt(null);
		};

		window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
		window.addEventListener("appinstalled", onAppInstalled);

		return () => {
			window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
			window.removeEventListener("appinstalled", onAppInstalled);
		};
	}, []);

	if (isInstalled || !deferredPrompt) {
		return null;
	}

	return (
		<button
			type="button"
			className={className}
			onClick={async () => {
				await deferredPrompt.prompt();
				await deferredPrompt.userChoice;
				setDeferredPrompt(null);
			}}
		>
			{label}
		</button>
	);
}
