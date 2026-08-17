import { en } from "./en";
import { sq } from "./sq";
import type { Locale } from "../config";

export const dictionaries: Record<Locale, typeof en> = { en, sq };
