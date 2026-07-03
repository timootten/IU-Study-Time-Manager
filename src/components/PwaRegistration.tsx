import { useEffect } from "react";

export default function PwaRegistration() {
	useEffect(() => {
		if (!("serviceWorker" in navigator)) {
			return;
		}

		const registerServiceWorker = async () => {
			try {
				const registrations = await navigator.serviceWorker.getRegistrations();
				await Promise.all(
					registrations
						.filter((registration) =>
							registration.active?.scriptURL.includes("/api/sw"),
						)
						.map((registration) => registration.unregister()),
				);

				await navigator.serviceWorker.register("/sw.js", { scope: "/" });
			} catch (error) {
				// Keep the app usable even if SW registration is unavailable.
				console.error("Service worker registration failed", error);
			}
		};

		const onLoad = () => {
			void registerServiceWorker();
		};

		if (document.readyState === "complete") {
			onLoad();
		} else {
			window.addEventListener("load", onLoad, { once: true });
		}

		return () => {
			window.removeEventListener("load", onLoad);
		};
	}, []);

	return null;
}
