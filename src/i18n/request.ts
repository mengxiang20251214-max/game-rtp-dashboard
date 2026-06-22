import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  pickLocaleFromAcceptLanguage,
  type Locale,
} from "./config";

export default getRequestConfig(async () => {
  // 1. 优先读取用户手动选择的 cookie
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;

  let locale: Locale;
  if (isLocale(cookieLocale)) {
    locale = cookieLocale;
  } else {
    // 2. 否则根据浏览器 Accept-Language 自动检测
    const acceptLanguage = headers().get("accept-language");
    locale = pickLocaleFromAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
