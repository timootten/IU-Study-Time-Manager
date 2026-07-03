import { createServerFn } from "@tanstack/react-start";
import { getLanguageFromRequest } from "./language.server";

export const getLanguage = createServerFn({ method: "GET" }).handler(() => {
	return getLanguageFromRequest();
});
