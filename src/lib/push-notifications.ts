import { env } from "#/env";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
	return navigator.serviceWorker.ready;
}

export async function isPushSupported(): Promise<boolean> {
	if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
		return false;
	}
	return true;
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
	try {
		const reg = await getServiceWorkerRegistration();
		return await reg.pushManager.getSubscription();
	} catch {
		return null;
	}
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
	try {
		const reg = await getServiceWorkerRegistration();
		const vapidPublicKey = env.VITE_VAPID_PUBLIC_KEY;
		if (!vapidPublicKey) {
			console.warn("VAPID public key not configured");
			return null;
		}

		const subscription = await reg.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
		});

		return subscription;
	} catch (error) {
		console.error("Failed to subscribe to push:", error);
		return null;
	}
}

export async function unsubscribeFromPush(): Promise<boolean> {
	try {
		const subscription = await getExistingSubscription();
		if (subscription) {
			await subscription.unsubscribe();
		}
		return true;
	} catch {
		return false;
	}
}

export function pushSubscriptionToPayload(sub: PushSubscription) {
	const json = sub.toJSON();
	return {
		endpoint: sub.endpoint,
		keys: {
			p256dh: json.keys?.p256dh ?? "",
			auth: json.keys?.auth ?? "",
		},
	};
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
	return Notification.requestPermission();
}

/**
 * Smart push prompt — only asks if:
 * - Push is supported on this device
 * - The user hasn't subscribed yet
 * - The user hasn't explicitly denied (permission !== "denied")
 *
 * Returns the subscription if successful, null otherwise.
 */
export async function maybePromptForPush(): Promise<PushSubscription | null> {
	// Never prompt if already denied
	if (Notification.permission === "denied") return null;

	// Already subscribed
	const existing = await getExistingSubscription();
	if (existing) return existing;

	// Not supported
	const supported = await isPushSupported();
	if (!supported) return null;

	// Ask for permission (only if "default" — first time)
	const permission = await requestNotificationPermission();
	if (permission !== "granted") return null;

	return subscribeToPush();
}
