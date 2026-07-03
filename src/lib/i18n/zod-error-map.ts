import { z } from "zod";
import i18n from "./index";

export const zodErrorMap: z.ZodErrorMap = (issue, ctx) => {
	const t = (key: string, vars?: Record<string, unknown>) =>
		i18n.t(`zod.${key}`, vars);

	switch (issue.code) {
		case z.ZodIssueCode.too_small:
			return {
				message:
					issue.type === "string"
						? t("tooSmallString", { min: issue.minimum })
						: t("tooSmall", { min: issue.minimum }),
			};
		case z.ZodIssueCode.too_big:
			return {
				message:
					issue.type === "string"
						? t("tooBigString", { max: issue.maximum })
						: t("tooBig", { max: issue.maximum }),
			};
		case z.ZodIssueCode.invalid_string:
			if (issue.validation === "email") return { message: t("invalidEmail") };
			if (issue.validation === "url") return { message: t("invalidUrl") };
			return { message: t("invalidFormat") };
		case z.ZodIssueCode.invalid_type:
			if (issue.received === "undefined" || issue.received === "null") {
				return { message: t("required") };
			}
			return { message: t("invalidType") };
		default:
			return { message: ctx.defaultError };
	}
};
