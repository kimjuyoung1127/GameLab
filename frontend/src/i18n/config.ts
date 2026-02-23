/** i18n 설정: 지원 로케일과 기본 로케일 정의. */
export const locales = ["ko", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ko";
