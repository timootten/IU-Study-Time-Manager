import { useTranslation } from "react-i18next";
import { getServiceUnavailableMessage } from "#/lib/errors/service-unavailable";

import ServiceUnavailablePage from "./ServiceUnavailablePage";

export interface ServiceRouteErrorConfig {
	unavailableTitle: string;
	fallbackTitle: string;
	fallbackDescription: string;
	/** When true, `unavailableTitle`, `fallbackTitle`, and `fallbackDescription` are treated as i18n keys. */
	useKeys?: boolean;
}

export interface ServiceRouteErrorKeyConfig {
	unavailableTitleKey: string;
	fallbackTitleKey: string;
	fallbackDescriptionKey: string;
}

type ServiceRouteErrorPropsInput =
	| (ServiceRouteErrorConfig & { useKeys?: false })
	| (ServiceRouteErrorConfig & { useKeys: true })
	| ServiceRouteErrorKeyConfig;

interface RouteServiceErrorRenderProps {
	error: unknown;
	config: ServiceRouteErrorPropsInput;
}

function resolveMessages(
	config: ServiceRouteErrorPropsInput,
	t: (key: string) => string,
) {
	if ("unavailableTitleKey" in config) {
		return {
			unavailableTitle: t(config.unavailableTitleKey),
			fallbackTitle: t(config.fallbackTitleKey),
			fallbackDescription: t(config.fallbackDescriptionKey),
		};
	}
	if (config.useKeys) {
		return {
			unavailableTitle: t(config.unavailableTitle),
			fallbackTitle: t(config.fallbackTitle),
			fallbackDescription: t(config.fallbackDescription),
		};
	}
	return {
		unavailableTitle: config.unavailableTitle,
		fallbackTitle: config.fallbackTitle,
		fallbackDescription: config.fallbackDescription,
	};
}

function RouteServiceErrorInner({
	error,
	unavailableTitle,
	fallbackTitle,
	fallbackDescription,
}: {
	error: unknown;
	unavailableTitle: string;
	fallbackTitle: string;
	fallbackDescription: string;
}) {
	const unavailableMessage = getServiceUnavailableMessage(error);

	if (unavailableMessage) {
		return (
			<ServiceUnavailablePage
				title={unavailableTitle}
				description={unavailableMessage}
			/>
		);
	}

	return (
		<ServiceUnavailablePage
			title={fallbackTitle}
			description={fallbackDescription}
		/>
	);
}

export function RouteServiceError({
	error,
	config,
}: RouteServiceErrorRenderProps) {
	const { t } = useTranslation();
	const messages = resolveMessages(config, t);
	return <RouteServiceErrorInner error={error} {...messages} />;
}

export function createServiceRouteErrorComponent(
	config: ServiceRouteErrorConfig | ServiceRouteErrorKeyConfig,
) {
	return function ServiceRouteErrorComponent({ error }: { error: unknown }) {
		return <RouteServiceError error={error} config={config} />;
	};
}
