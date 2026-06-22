import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, isLocale, type Locale } from "./config";

// 前台固定印尼语；后台可切换（默认中文）。
// 通过 middleware 写入的 x-pathname 区分前后台。
const PUBLIC_LOCALE: Locale = "id";
const ADMIN_DEFAULT_LOCALE: Locale = "zh";

export default getRequestConfig(async () => {
  const pathname = headers().get("x-pathname") || "";
  const isAdmin = pathname.startsWith("/admin");

  let locale: Locale;
  if (isAdmin) {
    // 后台：用户选择的 cookie 优先，否则默认中文
    const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
    locale = isLocale(cookieLocale) ? cookieLocale : ADMIN_DEFAULT_LOCALE;
  } else {
    // 前台：固定印尼语，不受 cookie / 浏览器语言影响
    locale = PUBLIC_LOCALE;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
